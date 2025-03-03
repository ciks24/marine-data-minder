
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ServiceFormData } from '../types/service';
import { Button } from './ui/button';
import { Save, Loader2 } from 'lucide-react';
import ImageUploader from './forms/ImageUploader';
import ServicePreviewDialog from './forms/ServicePreviewDialog';
import ServiceFormFields from './forms/ServiceFormFields';

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

  return (
    <form onSubmit={handleSubmit(() => setPreviewOpen(true))} className="space-y-6">
      <ServiceFormFields 
        register={register} 
        errors={errors} 
        isSubmitting={isSubmitting} 
      />

      <ImageUploader
        selectedPhotos={selectedPhotos}
        setSelectedPhotos={setSelectedPhotos}
        photosToRemove={photosToRemove}
        setPhotosToRemove={setPhotosToRemove}
        isSubmitting={isSubmitting}
      />

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

      <ServicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        formData={formData}
        selectedPhotos={selectedPhotos}
        photosToRemove={photosToRemove}
        onSubmit={() => handleFormSubmit(formData)}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
      />
    </form>
  );
};

export default ServiceForm;
