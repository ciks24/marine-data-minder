
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ServiceFormData } from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Camera, Save, X, Loader2, Trash2, Plus, Download } from 'lucide-react';
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
  
  // Establecer fecha y hora actuales al iniciar el formulario (si es nuevo registro)
  useEffect(() => {
    if (!isEditMode) {
      const now = new Date();
      const localISOString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
        .toISOString()
        .slice(0, 16); // Formato YYYY-MM-DDThh:mm para input datetime-local
      
      setValue('startDateTime', localISOString);
    }
  }, [isEditMode]);
  
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

  const formData = watch();

  useEffect(() => {
    // Initialize photos from initial data
    if (initialData) {
      const photosList: string[] = [];
      
      // Handle legacy single photo
      if (initialData.photoUrl && initialData.photoUrl.trim() !== '') {
        photosList.push(initialData.photoUrl);
      }
      
      // Handle multiple photos if available
      if (initialData.photoUrls && initialData.photoUrls.length > 0) {
        // Merge without duplicates
        initialData.photoUrls.forEach(url => {
          if (!photosList.includes(url)) {
            photosList.push(url);
          }
        });
      }
      
      setSelectedPhotos(photosList);
    }
  }, [initialData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        setSelectedPhotos(prev => [...prev, photoUrl]);
        // Remove from removal list if re-added
        setPhotosToRemove(prev => prev.filter(index => index >= selectedPhotos.length));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data: ServiceFormData) => {
    // Filter out photos marked for removal
    const updatedPhotos = selectedPhotos.filter((_, index) => !photosToRemove.includes(index));
    
    // Handle backward compatibility for single photo
    data.photoUrl = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
    data.photoUrls = updatedPhotos;
    
    onSubmit(data);
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
              <Plus className="w-4 h-4" />
              <span>Agregar Foto</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('photo-camera')?.click()}
              className="flex items-center space-x-2"
              disabled={isSubmitting}
            >
              <Camera className="w-4 h-4" />
              <span>Tomar Foto</span>
            </Button>

            <input
              id="photo-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
            
            <input
              id="photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
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
              <p>{new Date(formData.startDateTime).toLocaleString()}</p>
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
          <DialogFooter className="flex justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
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
