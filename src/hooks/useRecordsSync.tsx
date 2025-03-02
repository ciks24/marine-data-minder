import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MarineService, ServiceFormData } from '@/types/service';
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
    const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
    setServices(loadedServices);
    setIsLoading(false);
  }, []);

  const fetchServicesFromCloud = async (showNotification = false) => {
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

        if (showNotification) {
          toast.success('Registros actualizados desde la nube');
        }
      }
    } catch (error) {
      console.error('Error al obtener servicios de la nube:', error);
      if (showNotification) {
        toast.error('Error al actualizar desde la nube');
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
      const localServices = JSON.parse(localStorage.getItem('services') || '[]');
      const unsyncedServices = localServices.filter(service => !service.synced);
      
      if (unsyncedServices.length === 0) {
        toast.info('No hay registros pendientes para sincronizar');
        return;
      }

      // Sincronizar servicios no sincronizados
      const syncedServices = await syncService.syncAllServices(unsyncedServices);
      
      // Obtener servicios desde la nube
      const cloudServices = await syncService.fetchAllServices();
      
      // Limpiar localStorage y guardar solo los servicios de la nube
      localStorage.setItem('services', JSON.stringify(cloudServices));
      setServices(cloudServices);
      
      toast.success(`${unsyncedServices.length} registro(s) sincronizado(s) exitosamente`);
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
      localStorage.setItem('services', JSON.stringify(updatedServices));
      setServices(updatedServices);

      setEditingService(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedServices = services.filter(service => service.id !== id);
      localStorage.setItem('services', JSON.stringify(updatedServices));
      setServices(updatedServices);

      if (isOnline && user) {
        await syncService.deleteService(id);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
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
