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
   * Sube múltiples imágenes al almacenamiento de Supabase
   * @param photoUrls - Array de URLs de datos de las imágenes (dataURL)
   * @returns Array de URLs públicas de las imágenes almacenadas
   */
  async uploadMultiplePhotos(photoUrls: string[]): Promise<string[]> {
    if (!photoUrls || photoUrls.length === 0) return [];
    
    const uploadPromises = photoUrls.map(url => this.uploadPhoto(url));
    const results = await Promise.all(uploadPromises);
    
    // Filter out any null results
    return results.filter(url => url !== null) as string[];
  },

  /**
   * Guarda un servicio en Supabase
   * @param service - El servicio a guardar
   * @returns El servicio guardado con datos actualizados
   */
  async saveService(service: MarineService): Promise<MarineService | null> {
    try {
      // Recopilar todas las fotos para subir (solo las que son data URLs)
      const photosToUpload: string[] = [];
      
      // Manejar las fotos múltiples
      if (service.photoUrls && service.photoUrls.length > 0) {
        service.photoUrls.forEach(url => {
          if (url.startsWith('data:image')) {
            photosToUpload.push(url);
          }
        });
      }
      
      // Subir todas las fotos
      let uploadedUrls: string[] = [];
      if (photosToUpload.length > 0) {
        try {
          uploadedUrls = await this.uploadMultiplePhotos(photosToUpload);
          if (uploadedUrls.length !== photosToUpload.length) {
            throw new Error('No se pudieron subir todas las fotos');
          }
        } catch (photoError: any) {
          console.error('Error subiendo fotos:', photoError);
          throw new Error(`Error al subir las fotos: ${photoError.message}`);
        }
      }
      
      // Reemplazar las URLs de datos con las URLs subidas
      let cloudPhotoUrl = service.photoUrl;
      let cloudPhotoUrls = [...(service.photoUrls || [])];
      
      // Reemplazar las fotos data:image con sus versiones subidas
      if (service.photoUrls && service.photoUrls.length > 0) {
        let uploadedIndex = 0;
        cloudPhotoUrls = service.photoUrls.map(url => {
          if (url.startsWith('data:image')) {
            return uploadedUrls[uploadedIndex++] || url;
          }
          return url;
        });
      }

      // Preparar el servicio para guardar
      const serviceToSave = {
        id: service.id,
        client_name: service.clientName,
        vessel_name: service.vesselName,
        start_date_time: service.startDateTime,
        details: service.details,
        photo_url: cloudPhotoUrl || '',
        photo_urls: cloudPhotoUrls,
        synced: true,
        created_at: service.createdAt,
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      // Guardar en Supabase
      const { data, error } = await supabase
        .from('marine_services')
        .upsert(serviceToSave)
        .select()
        .single();

      if (error) {
        console.error('Error guardando en Supabase:', error);
        throw new Error(`Error al guardar en la base de datos: ${error.message}`);
      }

      // Convertir la respuesta al formato MarineService
      const savedService: MarineService = {
        id: data.id,
        clientName: data.client_name,
        vesselName: data.vessel_name,
        startDateTime: data.start_date_time,
        details: data.details,
        photoUrl: data.photo_url,
        photoUrls: cloudPhotoUrls,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        synced: true
      };

      return savedService;
    } catch (error: any) {
      console.error('Error en saveService:', error);
      throw error;
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
        // Extract additional photos from metadata or use an empty array if not available
        photoUrls: [],
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
