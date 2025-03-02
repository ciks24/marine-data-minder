import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MarineService, ServiceFormData } from '@/types/service';
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { openDB } from 'idb';

// Configuración de IndexedDB
const DB_NAME = 'marine-data-minder';
const STORE_NAME = 'services';
const DB_VERSION = 1;

// Inicializar IndexedDB
const initDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
    return db;
  } catch (error) {
    console.error('Error inicializando IndexedDB:', error);
    return null;
  }
};

// Función para verificar disponibilidad de localStorage
const checkStorageAvailability = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const useRecordsSync = () => {
  const [services, setServices] = useState<MarineService[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<MarineService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  // Cargar datos locales
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        if (checkStorageAvailability()) {
          const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
          setServices(loadedServices);
        } else {
          const db = await initDB();
          if (db) {
            const loadedServices = await db.getAll(STORE_NAME);
            setServices(loadedServices);
          }
        }
      } catch (error) {
        console.error('Error cargando datos locales:', error);
        toast.error('Error al cargar los datos locales');
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalData();
  }, []);

  const saveToLocalStorage = async (updatedServices: MarineService[]) => {
    try {
      // Asegurarse de que los servicios tengan la estructura correcta
      const validatedServices = updatedServices.map(service => ({
        id: service.id,
        clientName: service.clientName || '',
        vesselName: service.vesselName || '',
        startDateTime: service.startDateTime || new Date().toISOString(),
        details: service.details || '',
        photoUrl: service.photoUrl || '',
        photoUrls: Array.isArray(service.photoUrls) ? service.photoUrls : [],
        createdAt: service.createdAt || new Date().toISOString(),
        updatedAt: service.updatedAt || new Date().toISOString(),
        synced: Boolean(service.synced)
      }));

      if (checkStorageAvailability()) {
        localStorage.setItem('services', JSON.stringify(validatedServices));
        return true;
      } else {
        const db = await initDB();
        if (!db) {
          console.error('No se pudo inicializar IndexedDB');
          return false;
        }

        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          await tx.store.clear();
          
          // Guardar servicios uno por uno para mejor manejo de errores
          for (const service of validatedServices) {
            await tx.store.add(service);
          }
          
          await tx.done;
          return true;
        } catch (txError) {
          console.error('Error en la transacción de IndexedDB:', txError);
          return false;
        }
      }
    } catch (error) {
      console.error('Error guardando datos localmente:', error);
      return false;
    }
  };

  const fetchServicesFromCloud = async (showNotification = false) => {
    if (!user || !isOnline) return;

    try {
      const cloudServices = await syncService.fetchAllServices();
      console.log('Servicios obtenidos de la nube:', cloudServices);
      
      // Obtener servicios locales
      let localServices: MarineService[] = [];
      try {
        if (checkStorageAvailability()) {
          localServices = JSON.parse(localStorage.getItem('services') || '[]');
        } else {
          const db = await initDB();
          if (db) {
            localServices = await db.getAll(STORE_NAME);
          }
        }
        console.log('Servicios locales obtenidos:', localServices);
      } catch (localError) {
        console.error('Error obteniendo servicios locales:', localError);
        localServices = [];
      }
      
      // Filtrar servicios locales no sincronizados
      const unsyncedServices = localServices.filter(
        local => !cloudServices.some(cloud => cloud.id === local.id) && !local.synced
      );
      console.log('Servicios no sincronizados:', unsyncedServices);
      
      // Combinar servicios de la nube con los no sincronizados
      const combinedServices = [...cloudServices, ...unsyncedServices];
      console.log('Servicios combinados:', combinedServices);
      
      // Guardar servicios combinados localmente
      const saved = await saveToLocalStorage(combinedServices);
      if (!saved) {
        console.error('Error guardando servicios combinados localmente');
        throw new Error('No se pudieron guardar los datos localmente');
      }

      // Actualizar estado
      setServices(combinedServices);
      
      if (showNotification) {
        const message = unsyncedServices.length > 0 
          ? `${cloudServices.length} registros actualizados y ${unsyncedServices.length} pendientes de sincronizar`
          : `${cloudServices.length} registros actualizados desde la nube`;
        toast.success(message);
      }
    } catch (error: any) {
      console.error('Error al obtener servicios de la nube:', error);
      if (showNotification) {
        const errorMessage = error.message || 'Error desconocido';
        toast.error(`Error al actualizar desde la nube: ${errorMessage}`);
      }
    }
  };

  const syncServices = async () => {
    if (!isOnline || !user) {
      toast.error('No hay conexión a Internet. Intente más tarde.');
      return;
    }

    setIsSyncing(true);
    try {
      // Obtener servicios locales no sincronizados
      let localServices: MarineService[] = [];
      
      if (checkStorageAvailability()) {
        localServices = JSON.parse(localStorage.getItem('services') || '[]');
      } else {
        const db = await initDB();
        if (db) {
          localServices = await db.getAll(STORE_NAME);
        }
      }
      
      const unsyncedServices = localServices.filter(service => !service.synced);
      
      if (unsyncedServices.length === 0) {
        toast.info('No hay registros pendientes para sincronizar');
        return;
      }

      // Sincronizar servicios no sincronizados
      const syncedServices = await syncService.syncAllServices(unsyncedServices);
      
      // Obtener servicios desde la nube
      const cloudServices = await syncService.fetchAllServices();
      
      // Guardar servicios actualizados localmente
      const saved = await saveToLocalStorage(cloudServices);
      if (saved) {
        setServices(cloudServices);
        toast.success(`${unsyncedServices.length} registro(s) sincronizado(s) exitosamente`);
      } else {
        throw new Error('No se pudieron guardar los datos actualizados localmente');
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      toast.error('Error al sincronizar. Intente nuevamente');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (service: MarineService) => {
    setEditingService(service);
    setIsEditing(true);
  };

  const uploadImageToSupabase = async (file: File | null): Promise<string | null> => {
    if (!file || !isOnline || !user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('service_photos')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('service_photos')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      return null;
    }
  };
  
  const dataURItoBlob = (dataURI: string): File | null => {
    if (!dataURI || !dataURI.startsWith('data:')) return null;
    
    try {
      const arr = dataURI.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], 'image.jpg', { type: mime });
    } catch (error) {
      console.error('Error converting data URI to blob:', error);
      return null;
    }
  };

  const handleUpdate = async (updatedData: ServiceFormData) => {
    if (!editingService) return;

    try {
      setIsSubmitting(true);
      
      const updatedService: MarineService = {
        ...editingService,
        clientName: updatedData.clientName,
        vesselName: updatedData.vesselName,
        details: updatedData.details,
        photoUrl: updatedData.photoUrl,
        photoUrls: updatedData.photoUrls || [],
        updatedAt: new Date().toISOString(),
        synced: false
      };

      const updatedServices = services.map(service => 
        service.id === updatedService.id ? updatedService : service
      );

      const saved = await saveToLocalStorage(updatedServices);
      if (saved) {
        setServices(updatedServices);
        setEditingService(null);
        setIsEditing(false);
        toast.success('Registro actualizado exitosamente');
      } else {
        throw new Error('No se pudo guardar la actualización localmente');
      }
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      toast.error('Error al actualizar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedServices = services.filter(service => service.id !== id);
      const saved = await saveToLocalStorage(updatedServices);
      
      if (saved) {
        setServices(updatedServices);
        
        if (isOnline && user) {
          await syncService.deleteService(id);
          toast.success('Registro eliminado exitosamente');
        } else {
          toast.info('Registro eliminado localmente. Se sincronizará cuando haya conexión');
        }
      } else {
        throw new Error('No se pudo eliminar el registro localmente');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar el registro');
    }
  };

  const refreshServices = async () => {
    if (!isOnline) {
      toast.error('No hay conexión a Internet para actualizar datos');
      return;
    }
    
    setIsLoading(true);
    try {
      await fetchServicesFromCloud(true);
    } catch (error) {
      toast.error('Error al actualizar desde la nube');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    services,
    isSyncing,
    isLoading,
    isOnline,
    editingService,
    isEditing,
    isSubmitting,
    setIsEditing,
    setEditingService,
    syncServices,
    refreshServices,
    handleEdit,
    handleUpdate,
    handleDelete,
    uploadImageToSupabase
  };
};
