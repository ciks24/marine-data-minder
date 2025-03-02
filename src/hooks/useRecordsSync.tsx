import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MarineService, ServiceFormData } from '@/types/service';
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { openDB } from 'idb';

// Configuración de IndexedDB
const DB_NAME = 'marine-data-minder-v3';
const STORE_NAME = 'marine-services-store';
const DB_VERSION = 3;

// Función para inicializar la base de datos
const initDB = async () => {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Si existe una versión anterior, eliminarla
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        
        // Crear nuevo store con índices
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('synced', 'synced');
        store.createIndex('updatedAt', 'updatedAt');
      },
    });
  } catch (error) {
    console.error('Error inicializando DB:', error);
    return null;
  }
};

// Función para guardar servicios de forma segura
const saveToLocalDB = async (services: MarineService[]): Promise<boolean> => {
  const db = await initDB();
  if (!db) return false;

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    
    // Guardar servicios en chunks para evitar transacciones muy grandes
    const chunkSize = 10;
    for (let i = 0; i < services.length; i += chunkSize) {
      const chunk = services.slice(i, i + chunkSize);
      await Promise.all(chunk.map(service => tx.store.add(service)));
    }
    
    await tx.done;
    return true;
  } catch (error) {
    console.error('Error guardando en IndexedDB:', error);
    return false;
  }
};

// Función para cargar servicios
const loadFromLocalDB = async (): Promise<MarineService[]> => {
  const db = await initDB();
  if (!db) return [];

  try {
    const services = await db.getAll(STORE_NAME);
    return services.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - 
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error cargando desde IndexedDB:', error);
    return [];
  }
};

export const useRecordsSync = () => {
  const [services, setServices] = useState<MarineService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingService, setEditingService] = useState<MarineService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  // Cargar datos al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const localServices = await loadFromLocalDB();
        setServices(localServices);
        
        // Si hay conexión, intentar sincronizar
        if (isOnline && user) {
          await syncServices();
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  const syncServices = async () => {
    if (!isOnline || !user) {
      toast.error('No hay conexión a Internet');
      return;
    }

    setIsSyncing(true);
    try {
      // Obtener servicios de Supabase
      const cloudServices = await syncService.fetchAllServices();
      
      if (!Array.isArray(cloudServices)) {
        throw new Error('Error al obtener datos de la nube');
      }
      
      // Guardar en IndexedDB
      const saved = await saveToLocalDB(cloudServices);
      if (!saved) {
        throw new Error('Error guardando datos localmente');
      }
      
      setServices(cloudServices);
      toast.success('Datos sincronizados correctamente');
    } catch (error: any) {
      console.error('Error en sincronización:', error);
      toast.error(`Error al sincronizar: ${error.message}`);
      
      // Intentar cargar datos locales como fallback
      try {
        const localServices = await loadFromLocalDB();
        setServices(localServices);
      } catch (localError) {
        console.error('Error cargando datos locales:', localError);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (service: MarineService) => {
    setEditingService(service);
    setIsEditing(true);
  };

  const handleUpdate = async (updatedData: ServiceFormData) => {
    if (!editingService) return;

    setIsSubmitting(true);
    try {
      // Actualizar en Supabase primero si hay conexión
      if (isOnline && user) {
        const savedService = await syncService.saveService({
          ...editingService,
          ...updatedData,
          updatedAt: new Date().toISOString()
        });

        if (savedService) {
          // Actualizar localmente
          const updatedServices = services.map(s => 
            s.id === savedService.id ? savedService : s
          );

          await saveToLocalDB(updatedServices);
          setServices(updatedServices);
          toast.success('Registro actualizado correctamente');
        }
      } else {
        // Actualizar solo localmente
        const updatedService: MarineService = {
          ...editingService,
          ...updatedData,
          updatedAt: new Date().toISOString(),
          synced: false
        };

        const updatedServices = services.map(s => 
          s.id === updatedService.id ? updatedService : s
        );

        const saved = await saveToLocalDB(updatedServices);
        if (!saved) throw new Error('Error guardando localmente');

        setServices(updatedServices);
        toast.success('Registro actualizado localmente');
      }

      setEditingService(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error en actualización:', error);
      toast.error('Error al actualizar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isOnline && user) {
        // Eliminar en Supabase primero
        await syncService.deleteService(id);
      }

      // Eliminar localmente
      const updatedServices = services.filter(s => s.id !== id);
      const saved = await saveToLocalDB(updatedServices);
      if (!saved) throw new Error('Error eliminando localmente');

      setServices(updatedServices);
      toast.success(isOnline ? 'Registro eliminado' : 'Registro eliminado localmente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar el registro');
    }
  };

  const refreshServices = async () => {
    if (!isOnline) {
      toast.error('Sin conexión a Internet');
      return;
    }
    
    setIsLoading(true);
    try {
      await syncServices();
    } catch (error) {
      toast.error('Error al actualizar datos');
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
    refreshServices: syncServices,
    handleEdit,
    handleUpdate,
    handleDelete
  };
};
