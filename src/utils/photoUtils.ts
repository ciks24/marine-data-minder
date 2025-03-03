import { MarineService } from '@/types/service';

/**
 * Prepara URLs únicas de fotos a partir de un servicio
 * Combina photoUrl (formato antiguo) y photoUrls (formato nuevo)
 * @param service Servicio marino del que extraer las fotos
 * @returns Array con URLs únicas de fotos
 */
export const prepareUniquePhotoUrls = (service: MarineService): string[] => {
  const uniqueUrls = new Set<string>();
  
  // Add all photos from photoUrls array
  if (Array.isArray(service.photoUrls)) {
    service.photoUrls.forEach(url => {
      if (url && typeof url === 'string') {
        uniqueUrls.add(url);
      }
    });
  }
  
  // Only add photoUrl if it's not already in the set
  if (service.photoUrl && typeof service.photoUrl === 'string' && !uniqueUrls.has(service.photoUrl)) {
    uniqueUrls.add(service.photoUrl);
  }
  
  return Array.from(uniqueUrls);
};

/**
 * Genera un hash más robusto para detectar duplicados
 * @param str - String a convertir en hash
 * @returns Hash como string
 */
export const generateImageHash = (str: string): string => {
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
};

/**
 * Verifica si una foto es duplicada comparando con un array de fotos existentes
 * @param newPhoto - URL de la nueva foto
 * @param existingPhotos - Array de URLs de fotos existentes
 * @returns true si la foto es duplicada
 */
export const isDuplicatePhoto = (newPhoto: string, existingPhotos: string[]): boolean => {
  if (!newPhoto || !existingPhotos.length) return false;
  
  // Si la foto es una URL ya subida, comparar directamente
  if (!newPhoto.startsWith('data:image')) {
    return existingPhotos.includes(newPhoto);
  }
  
  // Para fotos en formato data URL, usar hash
  const newHash = generateImageHash(newPhoto);
  return existingPhotos.some(photo => {
    if (!photo.startsWith('data:image')) return false;
    return generateImageHash(photo) === newHash;
  });
};

/**
 * Elimina duplicados de un array de URLs de fotos
 * @param photos - Array de URLs de fotos
 * @returns Array de URLs únicas
 */
export const removeDuplicatePhotos = (photos: string[]): string[] => {
  const uniquePhotos = new Map<string, string>();
  
  photos.forEach(photo => {
    if (!photo) return;
    
    if (!photo.startsWith('data:image')) {
      // Para URLs ya subidas, usar la URL como clave
      if (!uniquePhotos.has(photo)) {
        uniquePhotos.set(photo, photo);
      }
    } else {
      // Para data URLs, usar hash como clave
      const hash = generateImageHash(photo);
      if (!uniquePhotos.has(hash)) {
        uniquePhotos.set(hash, photo);
      }
    }
  });
  
  return Array.from(uniquePhotos.values());
};
