
import React from 'react';
import { Camera, Image, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { isDuplicatePhoto } from '@/utils/photoUtils';

interface ImageUploaderProps {
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  photosToRemove: number[];
  setPhotosToRemove: React.Dispatch<React.SetStateAction<number[]>>;
  isSubmitting: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedPhotos,
  setSelectedPhotos,
  photosToRemove,
  setPhotosToRemove,
  isSubmitting
}) => {
  const handleGalleryPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        // Verificar duplicados antes de agregar
        if (!isDuplicatePhoto(photoUrl, selectedPhotos)) {
          setSelectedPhotos(prev => [...prev, photoUrl]);
          console.log('Foto de galería añadida');
        } else {
          console.log('Foto de galería duplicada, no se añadió');
        }
        // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        // Verificar duplicados antes de agregar
        if (!isDuplicatePhoto(photoUrl, selectedPhotos)) {
          setSelectedPhotos(prev => [...prev, photoUrl]);
          console.log('Foto de cámara añadida');
        } else {
          console.log('Foto de cámara duplicada, no se añadió');
        }
        // Limpiar el input para permitir capturar otra foto
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotosToRemove(prev => [...prev, indexToRemove]);
  };

  const isPhotoMarkedForRemoval = (index: number) => photosToRemove.includes(index);

  return (
    <div>
      <Label className="block mb-2">
        Fotos
      </Label>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('photo-file')?.click()}
          className="flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <Image className="w-4 h-4 mr-2" />
          <span>Seleccionar de Galería</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('photo-camera')?.click()}
          className="flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <Camera className="w-4 h-4 mr-2" />
          <span>Tomar Foto</span>
        </Button>

        <input
          id="photo-file"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryPhotoSelect}
          disabled={isSubmitting}
        />
        
        <input
          id="photo-camera"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraPhotoCapture}
          disabled={isSubmitting}
        />
      </div>
      
      {selectedPhotos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {selectedPhotos.map((photo, index) => (
            <div key={index} className={`relative rounded-lg overflow-hidden border ${isPhotoMarkedForRemoval(index) ? 'opacity-40 border-red-400' : 'border-gray-200'}`}>
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                onClick={() => isPhotoMarkedForRemoval(index) ? 
                  setPhotosToRemove(prev => prev.filter(i => i !== index)) : 
                  handleRemovePhoto(index)}
                disabled={isSubmitting}
              >
                {isPhotoMarkedForRemoval(index) ? 
                  <Plus className="h-4 w-4" /> : 
                  <X className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {photosToRemove.length > 0 && (
        <p className="mt-2 text-amber-600 dark:text-amber-400">
          {photosToRemove.length === selectedPhotos.length ? 
            "Todas las fotos serán eliminadas al guardar." : 
            `${photosToRemove.length} foto(s) marcada(s) para eliminar al guardar.`}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
