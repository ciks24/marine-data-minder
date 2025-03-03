
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ServiceFormData } from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Camera, Save, X, Loader2, Image, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';

interface ServiceFormProps {
  onSubmit: (data: ServiceFormData) => void;
  initialData?: ServiceFormData;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  disableDateTime?: boolean;
  serviceId?: string;
}

const ServiceForm = ({ 
  onSubmit, 
  initialData, 
  isSubmitting = false, 
  isEditMode = false,
  disableDateTime = false
}: ServiceFormProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photosToRemove, setPhotosToRemove] = useState<number[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: initialData || {
      clientName: '',
      vesselName: '',
      startDateTime: '',
      details: '',
      photoUrl: '',
      photoUrls: [],
    },
  });

  // Establecer fecha y hora actuales al iniciar el formulario (si es nuevo registro)
  useEffect(() => {
    if (!isEditMode) {
      const now = new Date();
      // Convertir a formato local considerando la zona horaria
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setValue('startDateTime', localDateTime);
    } else if (initialData?.startDateTime) {
      // Para modo edición, convertir la fecha almacenada a formato local
      const date = new Date(initialData.startDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setValue('startDateTime', localDateTime);
    }
  }, [isEditMode, initialData, setValue]);
  
  const formData = watch();

  useEffect(() => {
    // Initialize photos from initial data without duplicating
    if (initialData) {
      // Usamos un Set para asegurar que no haya duplicados
      const uniquePhotosSet = new Set<string>();
      
      // Handle multiple photos if available
      if (initialData.photoUrls && initialData.photoUrls.length > 0) {
        // Add all unique photos from photoUrls
        initialData.photoUrls.forEach(url => {
          if (url && typeof url === 'string') {
            uniquePhotosSet.add(url);
          }
        });
      }
      
      // Handle legacy single photo - only add if it's not already in the set
      if (initialData.photoUrl && initialData.photoUrl.trim() !== '') {
        uniquePhotosSet.add(initialData.photoUrl);
      }
      
      // Convertir a array
      const photosList = Array.from(uniquePhotosSet);
      console.log('Fotos inicializadas en ServiceForm:', photosList.length);
      
      setSelectedPhotos(photosList);
    }
  }, [initialData]);

  /**
   * Genera un hash simple para detectar duplicados en data URLs
   * @param str - String a hashear
   * @returns Hash como string
   */
  const generateImageHash = (str: string): string => {
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

  // Función para verificar si una imagen ya existe en la selección
  const isDuplicatePhoto = (newPhotoUrl: string): boolean => {
    // Para data URLs, comparamos un hash
    if (newPhotoUrl.startsWith('data:image')) {
      const newHash = generateImageHash(newPhotoUrl);
      return selectedPhotos.some(url => 
        url.startsWith('data:image') && generateImageHash(url) === newHash
      );
    }
    // Para URLs normales, comparamos la cadena completa
    return selectedPhotos.includes(newPhotoUrl);
  };

  const handleGalleryPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        // Verificar duplicados antes de agregar
        if (!isDuplicatePhoto(photoUrl)) {
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
        if (!isDuplicatePhoto(photoUrl)) {
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

  const handleFormSubmit = (data: ServiceFormData) => {
    // Asegurar que la fecha se guarde en formato ISO con la zona horaria correcta
    const dateTime = new Date(data.startDateTime);
    const isoString = dateTime.toISOString();
    
    // Filter out photos marked for removal
    const updatedPhotos = selectedPhotos.filter((_, index) => !photosToRemove.includes(index));
    
    // Eliminar posibles duplicados antes de enviar
    const uniquePhotosSet = new Set(updatedPhotos);
    const uniquePhotos = Array.from(uniquePhotosSet);
    
    // Handle backward compatibility for single photo
    const formData = {
      ...data,
      startDateTime: isoString,
      photoUrl: uniquePhotos.length > 0 ? uniquePhotos[0] : '',
      photoUrls: uniquePhotos
    };
    
    console.log('Enviando formulario con fotos:', uniquePhotos.length);
    onSubmit(formData);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotosToRemove(prev => [...prev, indexToRemove]);
  };

  const isPhotoMarkedForRemoval = (index: number) => photosToRemove.includes(index);

  return (
    <form onSubmit={handleSubmit(() => setPreviewOpen(true))} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="clientName">Nombre de Cliente</Label>
          <Input
            id="clientName"
            {...register('clientName', { required: 'Este campo es requerido' })}
            className="form-input"
            placeholder="Ingrese el nombre del cliente"
            disabled={isSubmitting}
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="vesselName">Embarcación</Label>
          <Input
            id="vesselName"
            {...register('vesselName', { required: 'Este campo es requerido' })}
            className="form-input"
            placeholder="Ingrese el nombre de la embarcación"
            disabled={isSubmitting}
          />
          {errors.vesselName && (
            <p className="mt-1 text-sm text-red-600">{errors.vesselName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="startDateTime">Fecha y Hora de Inicio</Label>
          <Input
            id="startDateTime"
            type="datetime-local"
            {...register('startDateTime', { required: 'Este campo es requerido' })}
            className="form-input"
            disabled={true}
            readOnly={true}
          />
          {errors.startDateTime && (
            <p className="mt-1 text-sm text-red-600">{errors.startDateTime.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="details">Detalle</Label>
          <Textarea
            id="details"
            {...register('details', { required: 'Este campo es requerido' })}
            className="form-input min-h-[100px]"
            placeholder="Ingrese los detalles del servicio"
            disabled={isSubmitting}
          />
          {errors.details && (
            <p className="mt-1 text-sm text-red-600">{errors.details.message}</p>
          )}
        </div>

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
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Previsualizar
            </>
          )}
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="app-title">{isEditMode ? 'Editar Registro' : 'Nuevo Registro de Servicio'}</DialogTitle>
            <DialogDescription>
              Revisa la información antes de guardar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Cliente</h3>
              <p>{formData.clientName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Embarcación</h3>
              <p>{formData.vesselName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Fecha y Hora</h3>
              <p>{new Date(formData.startDateTime).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Detalle</h3>
              <p className="whitespace-pre-wrap">{formData.details}</p>
            </div>
            {selectedPhotos.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Fotos ({selectedPhotos.length - photosToRemove.length} de {selectedPhotos.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {selectedPhotos.map((photo, index) => !isPhotoMarkedForRemoval(index) && (
                    <img
                      key={index}
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full max-h-40 object-cover rounded-lg shadow-sm"
                    />
                  ))}
                </div>
                {photosToRemove.length > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 mt-2">
                    {photosToRemove.length} foto(s) será(n) eliminada(s)
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-end mt-6 gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                handleFormSubmit(formData);
                setPreviewOpen(false);
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ServiceForm;
