
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
 * Genera un hash simple para detectar duplicados en data URLs de imágenes
 * @param str String a hashear (normalmente una data URL)
 * @returns Hash como string hexadecimal
 */
export const generateImageHash = (str: string): string => {
  // Para imágenes data:URL, usamos los primeros 500 caracteres
  const sample = str.substring(0, 500);
  
  // Algoritmo simple de hashing
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) - hash) + sample.charCodeAt(i);
    hash |= 0; // Convertir a entero de 32 bits
  }
  return hash.toString(16);
};

/**
 * Verifica si una imagen es un duplicado en una colección de imágenes
 * @param newPhotoUrl URL o data URL de la nueva imagen
 * @param existingPhotos Array de URLs o data URLs existentes
 * @returns true si es un duplicado, false si no lo es
 */
export const isDuplicatePhoto = (newPhotoUrl: string, existingPhotos: string[]): boolean => {
  // Para data URLs, comparamos un hash
  if (newPhotoUrl.startsWith('data:image')) {
    const newHash = generateImageHash(newPhotoUrl);
    return existingPhotos.some(url => 
      url.startsWith('data:image') && generateImageHash(url) === newHash
    );
  }
  // Para URLs normales, comparamos la cadena completa
  return existingPhotos.includes(newPhotoUrl);
};
