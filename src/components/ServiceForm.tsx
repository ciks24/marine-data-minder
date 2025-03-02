
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ServiceFormData } from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Camera, Save, X, Loader2, Trash2 } from 'lucide-react';
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
}

const ServiceForm = ({ 
  onSubmit, 
  initialData, 
  isSubmitting = false, 
  isEditMode = false,
  disableDateTime = false
}: ServiceFormProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  
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
    },
  });

  const formData = watch();

  useEffect(() => {
    // Si hay una foto en los datos iniciales, establecerla como la seleccionada
    if (initialData?.photoUrl) {
      setSelectedPhoto(initialData.photoUrl);
    }
  }, [initialData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhoto(reader.result as string);
        setRemovePhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data: ServiceFormData) => {
    if (removePhoto) {
      data.photoUrl = '';
    } else if (selectedPhoto) {
      data.photoUrl = selectedPhoto;
    }
    onSubmit(data);
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setRemovePhoto(true);
  };

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
          <Label htmlFor="photo" className="block mb-2">
            Foto
          </Label>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('photo')?.click()}
              className="flex items-center space-x-2"
              disabled={isSubmitting}
            >
              <Camera className="w-4 h-4" />
              <span>Tomar Foto</span>
            </Button>
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
            
            {selectedPhoto && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemovePhoto}
                className="flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Foto</span>
              </Button>
            )}
          </div>
          {selectedPhoto && (
            <div className="mt-4">
              <img
                src={selectedPhoto}
                alt="Preview"
                className="w-full max-w-md rounded-lg shadow-sm"
              />
            </div>
          )}
          {removePhoto && (
            <p className="mt-2 text-amber-600 dark:text-amber-400">La foto será eliminada al guardar.</p>
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
            {selectedPhoto && !removePhoto && (
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Foto</h3>
                <img
                  src={selectedPhoto}
                  alt="Preview"
                  className="mt-2 w-full max-w-md rounded-lg shadow-sm"
                />
              </div>
            )}
            {removePhoto && (
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Foto</h3>
                <p className="text-amber-600 dark:text-amber-400">La foto será eliminada</p>
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
