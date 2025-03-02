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
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          console.log(`Actualizando base de datos de v${oldVersion} a v${newVersion}`);
          
          try {
            // Si existe una versión anterior, eliminarla
            if (db.objectStoreNames.contains(STORE_NAME)) {
              console.log('Eliminando store anterior');
              db.deleteObjectStore(STORE_NAME);
            }
            
            // Crear nuevo store con índices
            console.log('Creando nuevo store con índices');
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('synced', 'synced');
            store.createIndex('updatedAt', 'updatedAt');
            
            console.log('Base de datos actualizada correctamente');
          } catch (upgradeError) {
            console.error('Error durante la actualización de la base de datos:', upgradeError);
            throw upgradeError;
          }
        },
        blocked() {
          console.warn('La base de datos está bloqueada por otra pestaña');
        },
        blocking() {
          console.warn('Esta pestaña está bloqueando una actualización de la base de datos');
        },
        terminated() {
          console.warn('La conexión con la base de datos fue terminada');
        }
      });

      // Verificar que la base de datos se inicializó correctamente
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        throw new Error('El store no fue creado correctamente');
      }

      return db;
    } catch (error) {
      console.error(`Error en intento ${retryCount + 1} de inicializar IndexedDB:`, error);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.error('No se pudo inicializar la base de datos después de todos los intentos');
        return null;
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  return null;
};

// Función para guardar servicios de forma segura
const saveToLocalDB = async (services: MarineService[]): Promise<boolean> => {
  const db = await initDB();
  if (!db) {
    console.error('No se pudo inicializar la base de datos local');
    return false;
  }

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    
    // Verificar que la transacción se creó correctamente
    if (!tx) {
      throw new Error('No se pudo crear la transacción');
    }

    // Limpiar datos existentes
    await tx.store.clear();
    
    // Validar servicios antes de guardar
    const validServices = services.filter(service => {
      if (!service.id || !service.startDateTime) {
        console.warn('Servicio inválido encontrado:', service);
        return false;
      }
      return true;
    });
    
    if (validServices.length === 0) {
      console.warn('No hay servicios válidos para guardar');
      return false;
    }
    
    // Guardar servicios en chunks para evitar transacciones muy grandes
    const chunkSize = 10;
    for (let i = 0; i < validServices.length; i += chunkSize) {
      const chunk = validServices.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async service => {
        try {
          await tx.store.add(service);
        } catch (error) {
          console.error(`Error guardando servicio ${service.id}:`, error);
          throw error;
        }
      }));
    }
    
    await tx.done;
    return true;
  } catch (error) {
    console.error('Error guardando en IndexedDB:', error);
    // Intentar recuperar la transacción si es posible
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (cleanupError) {
      console.error('Error limpiando la base de datos:', cleanupError);
    }
    return false;
  }
};

// Función para cargar servicios
const loadFromLocalDB = async (): Promise<MarineService[]> => {
  const db = await initDB();
  if (!db) {
    console.error('No se pudo inicializar la base de datos local');
    return [];
  }

  try {
    // Intentar obtener todos los servicios
    const rawServices = await db.getAll(STORE_NAME);
    
    // Validar y limpiar los datos
    const validServices = rawServices
      .filter(service => {
        if (!service || typeof service !== 'object') {
          console.warn('Servicio inválido encontrado:', service);
          return false;
        }
        
        if (!service.id || !service.startDateTime) {
          console.warn('Servicio con datos incompletos:', service);
          return false;
        }
        
        return true;
      })
      .map(service => ({
        ...service,
        // Asegurar que los campos requeridos existan
        clientName: service.clientName || '',
        vesselName: service.vesselName || '',
        details: service.details || '',
        photoUrl: service.photoUrl || '',
        photoUrls: Array.isArray(service.photoUrls) ? service.photoUrls.filter(url => url && typeof url === 'string') : [],
        createdAt: service.createdAt || service.startDateTime,
        updatedAt: service.updatedAt || service.startDateTime,
        synced: Boolean(service.synced)
      }));

    // Ordenar por fecha de actualización
    return validServices.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - 
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error cargando desde IndexedDB:', error);
    
    // Intentar recuperar la base de datos si es posible
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const count = await tx.store.count();
      console.warn(`Registros en la base de datos: ${count}`);
      await tx.done;
    } catch (checkError) {
      console.error('Error verificando la base de datos:', checkError);
    }
    
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
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
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
        return; // Salir del bucle si todo fue exitoso
      } catch (error: any) {
        console.error(`Intento ${retryCount + 1} fallido:`, error);
        retryCount++;
        
        if (retryCount === maxRetries) {
          console.error('Error en sincronización después de todos los intentos:', error);
          toast.error(`Error al sincronizar: ${error.message}`);
          
          // Intentar cargar datos locales como fallback
          try {
            const localServices = await loadFromLocalDB();
            setServices(localServices);
            toast.warning('Se están mostrando datos locales');
          } catch (localError) {
            console.error('Error cargando datos locales:', localError);
            toast.error('No se pudieron cargar los datos');
          }
        } else {
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          toast.warning(`Reintentando sincronización (intento ${retryCount + 1} de ${maxRetries})...`);
        }
      }
    }
    setIsSyncing(false);
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
