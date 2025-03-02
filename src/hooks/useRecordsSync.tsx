import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MarineService, ServiceFormData } from '@/types/service';
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useRecordsSync = () => {
  const [services, setServices] = useState<MarineService[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<MarineService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  useEffect(() => {
    const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
    setServices(loadedServices);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marine_services'
        },
        async () => {
          if (isOnline) {
            await fetchServicesFromCloud();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOnline]);

  useEffect(() => {
    if (isOnline && user && !isLoading) {
      toast.info('Conexión a Internet detectada. Sincronizando datos...');
      syncServices();
    }
  }, [isOnline, user]);

  const fetchServicesFromCloud = async () => {
    if (!user || !isOnline) return;

    try {
      const cloudServices = await syncService.fetchAllServices();
      
      if (cloudServices.length > 0) {
        const localServices = JSON.parse(localStorage.getItem('services') || '[]');
        
        const localOnlyServices = localServices.filter(
          local => !cloudServices.some(cloud => cloud.id === local.id)
        );
        
        const combinedServices = [...cloudServices, ...localOnlyServices];
        
        localStorage.setItem('services', JSON.stringify(combinedServices));
        setServices(combinedServices);
      }
    } catch (error) {
      console.error('Error al obtener servicios de la nube:', error);
    }
  };

  const syncServices = async () => {
    if (!isOnline || !user) {
      toast.error('No hay conexión a Internet. Intente más tarde.');
      return;
    }

    setIsSyncing(true);
    try {
      const syncedServices = await syncService.syncAllServices(services);
      setServices(syncedServices);
      
      await fetchServicesFromCloud();
      
      toast.success('Registros sincronizados exitosamente');
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

  const handleUpdate = async (updatedData: ServiceFormData) => {
    if (!editingService) return;

    try {
      setIsSubmitting(true);
      
      const updatedService: MarineService = {
        ...editingService,
        ...updatedData,
        updatedAt: new Date().toISOString(),
        synced: false
      };

      const updatedServices = services.map(service => 
        service.id === updatedService.id ? updatedService : service
      );
      localStorage.setItem('services', JSON.stringify(updatedServices));
      setServices(updatedServices);

      if (isOnline && user) {
        const syncedService = await syncService.saveService(updatedService);
        
        if (syncedService) {
          const newServices = updatedServices.map(s => 
            s.id === syncedService.id ? syncedService : s
          );
          localStorage.setItem('services', JSON.stringify(newServices));
          setServices(newServices);
          toast.success('Servicio actualizado y sincronizado exitosamente');
        } else {
          toast.warning('Servicio actualizado localmente, pero no se pudo sincronizar');
        }
      } else {
        toast.info('Servicio actualizado localmente. Se sincronizará cuando haya conexión');
      }

      setEditingService(null);
    } catch (error) {
      toast.error('Error al actualizar el servicio');
      console.error('Error updating service:', error);
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedServices = services.filter(service => service.id !== id);
      localStorage.setItem('services', JSON.stringify(updatedServices));
      setServices(updatedServices);

      if (isOnline && user) {
        const deleted = await syncService.deleteService(id);
        if (!deleted) {
          toast.warning('El registro se eliminó localmente, pero no en la nube');
        } else {
          toast.success('Registro eliminado completamente');
        }
      } else {
        toast.info('Registro eliminado localmente. Se actualizará en la nube al reconectar');
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
      await fetchServicesFromCloud();
      toast.success('Registros actualizados desde la nube');
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
    handleDelete
  };
};
