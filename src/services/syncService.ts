import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarineService, ServiceFormData } from '@/types/service';
import { toast } from 'sonner';
import { removeDuplicatePhotos } from '@/utils/photoUtils';
import { generateUUID } from '../utils/uuid';

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

      // Reducir el tamaño de la imagen antes de subirla
      const compressedImage = await this.compressImage(photoUrl);
      if (!compressedImage) {
        console.error('Error al comprimir la imagen');
        return null;
      }

      // Convertir data URL a File
      const res = await fetch(compressedImage);
      const blob = await res.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Nombre único para la imagen
      const filePath = `${generateUUID()}.jpg`;
      
      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage
        .from('service_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Si el error es porque el archivo ya existe, intentamos obtener su URL
        if (error.message.includes('already exists')) {
          console.warn('La imagen ya existe, obteniendo URL pública...');
          const { data: { publicUrl } } = supabase.storage
            .from('service_photos')
            .getPublicUrl(filePath);
          return publicUrl;
        }
        
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
   * Función para comprimir imágenes
   * @param dataUrl - La URL de datos de la imagen
   * @param maxWidth - Ancho máximo para la imagen comprimida
   * @returns La URL de la imagen comprimida
   */
  async compressImage(dataUrl: string, maxWidth = 800): Promise<string | null> {
    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo la proporción
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Comprimir con calidad 0.7
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      return null;
    }
  },

  /**
   * Genera un hash más robusto para detectar duplicados
   * @param str - String a convertir en hash
   * @returns Hash como string
   */
  generateImageHash(str: string): string {
    // Para imágenes data:URL, usamos los primeros 1000 caracteres que contienen la
    // información de cabecera y parte de los datos
    const sample = str.substring(0, 1000);
    
    // Algoritmo simple de hashing
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash) + sample.charCodeAt(i);
      hash |= 0; // Convertir a entero de 32 bits
    }
    return hash.toString(16); // Convertir a hexadecimal para hacerlo más compacto
  },

  /**
   * Sube múltiples imágenes al almacenamiento de Supabase
   * @param photoUrls - Array de URLs de datos de las imágenes (dataURL)
   * @returns Array de URLs públicas de las imágenes almacenadas
   */
  async uploadMultiplePhotos(photoUrls: string[]): Promise<string[]> {
    if (!photoUrls || photoUrls.length === 0) return [];
    
    // Eliminar duplicados antes de subir
    const uniqueUrls = removeDuplicatePhotos(photoUrls);
    console.log(`Detectadas ${photoUrls.length - uniqueUrls.length} imágenes duplicadas`);
    
    // Separar URLs existentes de data URLs
    const dataUrls = uniqueUrls.filter(url => url.startsWith('data:image'));
    const existingUrls = uniqueUrls.filter(url => !url.startsWith('data:image'));
    
    // Subir todas las imágenes únicas
    const uploadPromises = dataUrls.map(url => this.uploadPhoto(url));
    const results = await Promise.all(uploadPromises);
    
    // Filtrar resultados nulos y combinar con URLs existentes
    return [...existingUrls, ...results.filter(url => url !== null) as string[]];
  },

  /**
   * Guarda un servicio en Supabase
   * @param service - El servicio a guardar
   * @returns El servicio guardado con datos actualizados
   */
  async saveService(service: MarineService): Promise<MarineService | null> {
    try {
      // Validar datos requeridos y usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      if (!service.id || !service.startDateTime) {
        throw new Error('Datos de servicio incompletos');
      }

      // Recopilar todas las fotos
      let allPhotos: string[] = [];
      
      // Procesar photoUrl legacy
      if (service.photoUrl && typeof service.photoUrl === 'string') {
        allPhotos.push(service.photoUrl);
      }
      
      // Procesar photoUrls
      if (Array.isArray(service.photoUrls)) {
        allPhotos = [...allPhotos, ...service.photoUrls];
      }
      
      // Eliminar duplicados
      const uniquePhotos = removeDuplicatePhotos(allPhotos);
      console.log(`Eliminadas ${allPhotos.length - uniquePhotos.length} imágenes duplicadas antes de subir`);
      
      // Separar URLs existentes de data URLs
      const dataUrls = uniquePhotos.filter(url => url.startsWith('data:image'));
      const existingUrls = uniquePhotos.filter(url => !url.startsWith('data:image'));
      
      // Subir todas las fotos nuevas
      let uploadedUrls: string[] = [];
      if (dataUrls.length > 0) {
        try {
          uploadedUrls = await this.uploadMultiplePhotos(dataUrls);
        } catch (photoError: any) {
          console.error('Error subiendo fotos:', photoError);
        }
      }
      
      // Combinar fotos existentes con las nuevas subidas
      const finalPhotoUrls = [...existingUrls, ...uploadedUrls];
      
      // Preparar el servicio para guardar
      const serviceToSave = {
        id: service.id,
        client_name: service.clientName || '',
        vessel_name: service.vesselName || '',
        start_date_time: service.startDateTime,
        details: service.details || '',
        photo_url: finalPhotoUrls[0] || '', // Primera foto como foto principal
        photo_urls: finalPhotoUrls, // Todas las fotos en el array
        created_at: service.createdAt || service.startDateTime,
        updated_at: new Date().toISOString(),
        user_id: user.id
      };

      console.log('Guardando servicio con fotos:', serviceToSave.photo_urls);

      // Guardar en Supabase con reintentos
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;

      while (attempts < maxAttempts) {
        try {
          const { data, error } = await supabase
            .from('marine_services')
            .upsert(serviceToSave)
            .select()
            .single();

          if (error) {
            lastError = error;
            throw error;
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
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            console.error(`Error después de ${maxAttempts} intentos:`, lastError);
            throw new Error(`Error al guardar en la base de datos después de ${maxAttempts} intentos: ${lastError?.message || 'Error desconocido'}`);
          }
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      throw new Error('Error inesperado al guardar el servicio');
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
   * Obtiene todos los servicios desde Supabase
   * @returns Lista de servicios
   */
  async fetchAllServices(): Promise<MarineService[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Obteniendo servicios para usuario:', user.id);

      const { data, error } = await supabase
        .from('marine_services')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo servicios:', error);
        throw new Error(`Error al obtener servicios: ${error.message}`);
      }

      console.log('Servicios obtenidos de Supabase:', data);

      if (!data) {
        console.warn('No se recibieron datos del servidor');
        return [];
      }

      // Convertir y validar los datos
      const validatedServices = data.map(item => {
        if (!item.id || !item.start_date_time) {
          console.warn('Servicio con datos incompletos:', item);
        }

        // Eliminar posibles duplicados en photo_urls
        let uniquePhotoUrls: string[] = [];
        if (Array.isArray(item.photo_urls)) {
          const seenUrls = new Set<string>();
          uniquePhotoUrls = item.photo_urls.filter(url => {
            if (url && typeof url === 'string' && !seenUrls.has(url)) {
              seenUrls.add(url);
              return true;
            }
            return false;
          });
        }

        return {
          id: item.id,
          clientName: item.client_name || '',
          vesselName: item.vessel_name || '',
          startDateTime: item.start_date_time,
          details: item.details || '',
          photoUrl: item.photo_url || '',
          photoUrls: uniquePhotoUrls,
          createdAt: item.created_at || item.start_date_time,
          updatedAt: item.updated_at || item.start_date_time,
          synced: true
        };
      });

      console.log('Servicios procesados:', validatedServices);
      return validatedServices;
    } catch (error: any) {
      console.error('Error en fetchAllServices:', error);
      throw new Error(`Error al sincronizar con el servidor: ${error.message}`);
    }
  },

  /**
   * Elimina un servicio de Supabase
   * @param id - ID del servicio a eliminar
   */
  async deleteService(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('marine_services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando servicio:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en deleteService:', error);
      throw error;
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

