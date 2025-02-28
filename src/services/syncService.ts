
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarineService, ServiceFormData } from '@/types/service';
import { toast } from 'sonner';

/**
 * Servicio para sincronizar datos con Supabase
 */
export const syncService = {
  /**
   * Sube una imagen al almacenamiento de Supabase
   * @param photoUrl - La URL de datos de la imagen (dataURL)
   * @returns La URL pública de la imagen almacenada
   */
  async uploadPhoto(photoUrl: string): Promise<string | null> {
    try {
      if (!photoUrl || !photoUrl.startsWith('data:image')) {
        return photoUrl; // No es una imagen en formato data URL
      }

      // Convertir data URL a File
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Nombre único para la imagen
      const filePath = `${crypto.randomUUID()}.jpg`;
      
      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('service_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error al subir la imagen:', error);
        return null;
      }

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('service_photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error en el proceso de subida de imagen:', error);
      return null;
    }
  },

  /**
   * Guarda un servicio en Supabase
   * @param service - El servicio a guardar
   * @returns El servicio guardado con datos actualizados
   */
  async saveService(service: MarineService): Promise<MarineService | null> {
    try {
      // Si la foto es un dataURL, subirla primero
      let cloudPhotoUrl = service.photoUrl;
      if (service.photoUrl && service.photoUrl.startsWith('data:image')) {
        cloudPhotoUrl = await this.uploadPhoto(service.photoUrl);
      }

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Preparar datos para Supabase (snake_case)
      const serviceData = {
        id: service.id,
        client_name: service.clientName,
        vessel_name: service.vesselName,
        start_date_time: service.startDateTime,
        details: service.details,
        photo_url: cloudPhotoUrl,
        user_id: user.id
      };

      // Guardar en Supabase
      const { data, error } = await supabase
        .from('marine_services')
        .upsert(serviceData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error al guardar el servicio en Supabase:', error);
        return null;
      }

      // Convertir respuesta a formato MarineService
      return {
        id: data.id,
        clientName: data.client_name,
        vesselName: data.vessel_name,
        startDateTime: data.start_date_time,
        details: data.details,
        photoUrl: data.photo_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        synced: true
      };
    } catch (error) {
      console.error('Error en el proceso de guardado del servicio:', error);
      return null;
    }
  },

  /**
   * Sincroniza todos los servicios locales con Supabase
   * @param services - Lista de servicios locales
   * @returns Los servicios sincronizados
   */
  async syncAllServices(services: MarineService[]): Promise<MarineService[]> {
    try {
      const unsyncedServices = services.filter(service => !service.synced);
      
      if (unsyncedServices.length === 0) {
        return services; // Nada que sincronizar
      }

      // Sincronizar cada servicio no sincronizado
      const syncPromises = unsyncedServices.map(service => this.saveService(service));
      const syncedResults = await Promise.allSettled(syncPromises);
      
      // Actualizar la lista local con los resultados
      const updatedServices = [...services];
      
      syncedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          // Encontrar y actualizar el servicio en la lista local
          const serviceIndex = updatedServices.findIndex(s => s.id === unsyncedServices[index].id);
          if (serviceIndex >= 0) {
            updatedServices[serviceIndex] = result.value;
          }
        }
      });

      // Actualizar localStorage
      localStorage.setItem('services', JSON.stringify(updatedServices));
      
      // Retornar la lista actualizada
      return updatedServices;
    } catch (error) {
      console.error('Error al sincronizar servicios:', error);
      return services; // Devolver la lista original en caso de error
    }
  },

  /**
   * Descarga todos los servicios desde Supabase
   * @returns Lista de servicios desde Supabase
   */
  async fetchAllServices(): Promise<MarineService[]> {
    try {
      const { data, error } = await supabase
        .from('marine_services')
        .select('*')
        .order('start_date_time', { ascending: false });

      if (error) {
        console.error('Error al obtener servicios de Supabase:', error);
        return [];
      }

      // Convertir datos a formato MarineService
      return data.map(item => ({
        id: item.id,
        clientName: item.client_name,
        vesselName: item.vessel_name,
        startDateTime: item.start_date_time,
        details: item.details,
        photoUrl: item.photo_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        synced: true
      }));
    } catch (error) {
      console.error('Error en el proceso de obtención de servicios:', error);
      return [];
    }
  },

  /**
   * Elimina un servicio de Supabase
   * @param id - ID del servicio a eliminar
   * @returns true si la eliminación fue exitosa
   */
  async deleteService(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marine_services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar el servicio de Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en el proceso de eliminación del servicio:', error);
      return false;
    }
  }
};

/**
 * Hook para verificar el estado de conexión a Internet
 * @returns Estado de conexión actual
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
