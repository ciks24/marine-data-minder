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
      // Validar datos requeridos
      if (!service.id || !service.startDateTime) {
        throw new Error('Datos de servicio incompletos');
      }

      // Recopilar todas las fotos para subir (solo las que son data URLs)
      const photosToUpload: string[] = [];
      
      // Manejar las fotos múltiples
      if (Array.isArray(service.photoUrls)) {
        service.photoUrls.forEach(url => {
          if (url && typeof url === 'string' && url.startsWith('data:image')) {
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
            console.warn('Algunas fotos no se pudieron subir');
          }
        } catch (photoError: any) {
          console.error('Error subiendo fotos:', photoError);
          // Continuar con el guardado aunque fallen las fotos
        }
      }
      
      // Reemplazar las URLs de datos con las URLs subidas
      let cloudPhotoUrl = service.photoUrl || '';
      let cloudPhotoUrls = Array.isArray(service.photoUrls) ? [...service.photoUrls] : [];
      
      // Reemplazar las fotos data:image con sus versiones subidas
      if (uploadedUrls.length > 0) {
        let uploadedIndex = 0;
        cloudPhotoUrls = cloudPhotoUrls.map(url => {
          if (url && url.startsWith('data:image')) {
            return uploadedUrls[uploadedIndex++] || url;
          }
          return url;
        });
      }

      // Preparar el servicio para guardar
      const serviceToSave = {
        id: service.id,
        client_name: service.clientName || '',
        vessel_name: service.vesselName || '',
        start_date_time: service.startDateTime,
        details: service.details || '',
        photo_url: cloudPhotoUrl,
        photo_urls: cloudPhotoUrls,
        created_at: service.createdAt || service.startDateTime,
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

      if (!data) {
        throw new Error('No se recibieron datos después de guardar');
      }

      // Convertir la respuesta al formato MarineService
      return {
        id: data.id,
        clientName: data.client_name || '',
        vesselName: data.vessel_name || '',
        startDateTime: data.start_date_time,
        details: data.details || '',
        photoUrl: data.photo_url || '',
        photoUrls: Array.isArray(data.photo_urls) ? data.photo_urls : [],
        createdAt: data.created_at || data.start_date_time,
        updatedAt: data.updated_at || data.start_date_time,
        synced: true
      };
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
      if (services.length === 0) {
        return [];
      }

      // Sincronizar cada servicio no sincronizado
      const syncPromises = services.map(service => this.saveService(service));
      const syncedResults = await Promise.allSettled(syncPromises);
      
      // Recopilar los resultados exitosos
      const successfulSyncs = syncedResults
        .filter((result): result is PromiseFulfilledResult<MarineService> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      // Registrar errores si los hay
      syncedResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error sincronizando servicio ${services[index].id}:`, result.reason);
        }
      });

      return successfulSyncs;
    } catch (error) {
      console.error('Error al sincronizar servicios:', error);
      throw error;
    }
  },

  /**
   * Descarga todos los servicios desde Supabase
   * @returns Lista de servicios desde Supabase
   */
  async fetchAllServices(): Promise<MarineService[]> {
    try {
      const { data: services, error } = await supabase
        .from('marine_services')
        .select('*')
        .order('start_date_time', { ascending: false });

      if (error) {
        console.error('Error al obtener servicios de Supabase:', error);
        throw new Error(`Error al obtener servicios: ${error.message}`);
      }

      if (!services || !Array.isArray(services)) {
        console.warn('No se encontraron servicios en Supabase o formato inválido');
        return [];
      }

      // Convertir y validar datos a formato MarineService
      return services.map(item => {
        // Asegurarse de que todos los campos requeridos existan
        if (!item.id || !item.start_date_time) {
          console.warn('Servicio con datos incompletos:', item);
          return null;
        }

        try {
          return {
            id: item.id,
            clientName: item.client_name || '',
            vesselName: item.vessel_name || '',
            startDateTime: item.start_date_time,
            details: item.details || '',
            photoUrl: item.photo_url || '',
            // Asegurarse de que photo_urls sea un array
            photoUrls: Array.isArray(item.photo_urls) ? item.photo_urls : [],
            createdAt: item.created_at || item.start_date_time,
            updatedAt: item.updated_at || item.start_date_time,
            synced: true
          };
        } catch (error) {
          console.error('Error procesando servicio:', error);
          return null;
        }
      }).filter((service): service is MarineService => service !== null);
    } catch (error) {
      console.error('Error en el proceso de obtención de servicios:', error);
      throw error;
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
