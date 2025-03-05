import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ServiceForm from '../components/ServiceForm';
import { syncService } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import type { ServiceFormData, MarineService } from '../types/service';
import { openDB } from 'idb';
import { generateUUID } from '../utils/uuid';

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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para verificar el espacio disponible en localStorage
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

  // Función para guardar en IndexedDB
  const saveToIndexedDB = async (service: MarineService) => {
    try {
      const db = await initDB();
      if (!db) throw new Error('No se pudo inicializar IndexedDB');
      
      await db.put(STORE_NAME, service);
      return true;
    } catch (error) {
      console.error('Error guardando en IndexedDB:', error);
      return false;
    }
  };

  // Función para obtener servicios de IndexedDB
  const getFromIndexedDB = async () => {
    try {
      const db = await initDB();
      if (!db) throw new Error('No se pudo inicializar IndexedDB');
      
      return await db.getAll(STORE_NAME);
    } catch (error) {
      console.error('Error obteniendo datos de IndexedDB:', error);
      return [];
    }
  };

  // Función para limpiar datos antiguos
  const cleanupOldData = async () => {
    try {
      let services: MarineService[] = [];
      
      // Intentar obtener servicios de localStorage primero
      if (checkStorageAvailability()) {
        services = JSON.parse(localStorage.getItem('services') || '[]');
      } else {
        // Si localStorage no está disponible, usar IndexedDB
        services = await getFromIndexedDB();
      }

      // Mantener solo los últimos 50 registros si hay más
      if (services.length > 50) {
        const sortedServices = services.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const trimmedServices = sortedServices.slice(0, 50);

        // Guardar servicios recortados
        if (checkStorageAvailability()) {
          localStorage.setItem('services', JSON.stringify(trimmedServices));
        } else {
          const db = await initDB();
          if (db) {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            await tx.store.clear();
            await Promise.all(trimmedServices.map(service => tx.store.put(service)));
          }
        }
      }
    } catch (e) {
      console.error('Error limpiando datos antiguos:', e);
    }
  };

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      setIsSubmitting(true);

      // Crear nuevo servicio con los datos del formulario
      const newService: MarineService = {
        ...data,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      };

      // Intentar limpiar datos antiguos primero
      await cleanupOldData();

      // Intentar guardar en localStorage primero
      let savedLocally = false;
      if (checkStorageAvailability()) {
        try {
          const services = JSON.parse(localStorage.getItem('services') || '[]');
          services.push(newService);
          localStorage.setItem('services', JSON.stringify(services));
          savedLocally = true;
        } catch (localError) {
          console.error('Error guardando en localStorage:', localError);
        }
      }

      // Si localStorage falla, intentar con IndexedDB
      if (!savedLocally) {
        savedLocally = await saveToIndexedDB(newService);
        if (!savedLocally) {
          toast.error('Error al guardar. Por favor, intente nuevamente.');
          return;
        }
      }

      // Intentar sincronizar con Supabase si hay conexión
      if (navigator.onLine && user) {
        try {
          const syncedService = await syncService.saveService(newService);
          
          if (syncedService) {
            // Actualizar el servicio en el almacenamiento local
            if (checkStorageAvailability()) {
              const services = JSON.parse(localStorage.getItem('services') || '[]');
              const updatedServices = services.map(s => 
                s.id === syncedService.id ? syncedService : s
              );
              localStorage.setItem('services', JSON.stringify(updatedServices));
            } else {
              await saveToIndexedDB(syncedService);
            }
            toast.success('Servicio registrado y sincronizado exitosamente');
          } else {
            toast.warning('Servicio guardado localmente, pero no se pudo sincronizar');
          }
        } catch (syncError: any) {
          console.error('Error sincronizando con Supabase:', syncError);
          toast.error(`Error al sincronizar: ${syncError.message || 'Error desconocido'}`);
        }
      } else {
        toast.info('Servicio guardado localmente. Se sincronizará cuando haya conexión');
      }

      navigate('/records');
    } catch (error: any) {
      console.error('Error general guardando servicio:', error);
      toast.error(`Error al guardar el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nuevo Registro de Servicio</h1>
        <ServiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};

export default Index;
