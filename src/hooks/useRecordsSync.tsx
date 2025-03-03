import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MarineService, ServiceFormData } from '@/types/service';
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from './useAuth';
import { openDB } from 'idb';
import { checkSupabaseConnection } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [services, setServices] = useState<MarineService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [hasOfflineChanges, setHasOfflineChanges] = useState(false);
  const [editingService, setEditingService] = useState<MarineService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (!user?.id) {
      console.log('No hay usuario autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Cargando datos iniciales. Online:', isOnline);

    try {
      // Intentar cargar datos locales primero
      const localData = localStorage.getItem(`marine-services-${user.id}`);
      const localServices = localData ? JSON.parse(localData) : [];
      
      if (isOnline) {
        // Si estamos online, intentar obtener datos de Supabase
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
          console.log('Obteniendo datos de Supabase...');
          const supabaseServices = await syncService.fetchAllServices();
          console.log(`${supabaseServices.length} registros obtenidos de Supabase`);
          
          // Comparar datos locales con Supabase para detectar cambios sin sincronizar
          const hasUnsyncedChanges = localServices.some(local => {
            const remote = supabaseServices.find(r => r.id === local.id);
            return !remote || local.updatedAt > remote.updatedAt;
          });
          
          setHasOfflineChanges(hasUnsyncedChanges);
          setServices(supabaseServices);
          
          // Actualizar cache local
          localStorage.setItem(`marine-services-${user.id}`, JSON.stringify(supabaseServices));
        } else {
          console.log('No se pudo conectar a Supabase, usando datos locales');
          setServices(localServices);
        }
      } else {
        console.log('Modo offline, usando datos locales');
        setServices(localServices);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Por favor intente nuevamente.');
      // Intentar usar datos locales como fallback
      const localData = localStorage.getItem(`marine-services-${user.id}`);
      if (localData) {
        setServices(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isOnline]);

  // Sincronizar cambios cuando se recupera la conexión
  useEffect(() => {
    if (isOnline && hasOfflineChanges) {
      console.log('Conexión recuperada, sincronizando cambios pendientes...');
      syncChanges();
    }
  }, [isOnline]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Función para sincronizar cambios
  const syncChanges = async () => {
    if (!user?.id || !isOnline) return;
    
    setSyncing(true);
    try {
      const localData = localStorage.getItem(`marine-services-${user.id}`);
      const localServices = localData ? JSON.parse(localData) : [];
      
      console.log('Iniciando sincronización de cambios...');
      const supabaseServices = await syncService.fetchAllServices();
      
      // Identificar y sincronizar cambios locales
      for (const localService of localServices) {
        const remoteService = supabaseServices.find(r => r.id === localService.id);
        if (!remoteService || localService.updatedAt > remoteService.updatedAt) {
          console.log(`Sincronizando servicio ${localService.id}...`);
          await syncService.saveService(localService);
        }
      }
      
      // Actualizar datos locales con los últimos de Supabase
      const updatedServices = await syncService.fetchAllServices();
      setServices(updatedServices);
      localStorage.setItem(`marine-services-${user.id}`, JSON.stringify(updatedServices));
      setHasOfflineChanges(false);
      
      console.log('Sincronización completada exitosamente');
    } catch (err) {
      console.error('Error durante la sincronización:', err);
      setError('Error al sincronizar los cambios. Por favor intente nuevamente.');
    } finally {
      setSyncing(false);
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
      const updatedService: MarineService = {
        ...editingService,
        ...updatedData,
        updatedAt: new Date().toISOString(),
        synced: isOnline
      };

      if (isOnline && user) {
        // Actualizar directamente en Supabase
        const savedService = await syncService.saveService(updatedService);
        if (savedService) {
          setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
          toast.success('Registro actualizado correctamente');
        }
      } else {
        // Guardar localmente y marcar para sincronización
        const updatedServices = services.map(s => 
          s.id === updatedService.id ? updatedService : s
        );
        await saveToLocalDB(updatedServices);
        setServices(updatedServices);
        setHasOfflineChanges(true);
        toast.success('Registro guardado localmente');
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
        // Eliminar directamente en Supabase
        await syncService.deleteService(id);
        setServices(prev => prev.filter(s => s.id !== id));
        toast.success('Registro eliminado');
      } else {
        // Marcar como eliminado localmente
        const updatedServices = services.filter(s => s.id !== id);
        await saveToLocalDB(updatedServices);
        setServices(updatedServices);
        setHasOfflineChanges(true);
        toast.success('Registro eliminado localmente');
      }
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
    
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Actualizando datos desde Supabase...');
      const cloudServices = await syncService.fetchAllServices();
      console.log('Datos actualizados recibidos:', cloudServices.length, 'registros');
      
      setServices(cloudServices);
      await saveToLocalDB(cloudServices);
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      toast.error('Error al actualizar datos');
      
      // Intentar cargar datos locales como fallback
      try {
        const localServices = await loadFromLocalDB();
        setServices(localServices);
        toast.warning('Mostrando datos locales');
      } catch (localError) {
        console.error('Error cargando datos locales:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    syncing,
    hasOfflineChanges,
    isSyncing: syncing,
    isLoading: loading,
    isOnline,
    editingService,
    isEditing,
    isSubmitting,
    setIsEditing,
    setEditingService,
    syncServices: refreshServices,
    refreshServices,
    handleEdit,
    handleUpdate,
    handleDelete,
    syncChanges,
    loadInitialData
  };
};
