
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ServiceFormData } from '../types/service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Camera, Save, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

interface ServiceFormProps {
  onSubmit: (data: ServiceFormData) => void;
  initialData?: ServiceFormData;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

const ServiceForm = ({ onSubmit, initialData, isSubmitting = false, isEditMode = false }: ServiceFormProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: initialData || {
      clientName: '',
      vesselName: '',
      startDateTime: '',
      details: '',
      photoUrl: '',
    },
  });

  const formData = watch();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data: ServiceFormData) => {
    if (selectedPhoto) {
      data.photoUrl = selectedPhoto;
    }
    onSubmit(data);
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
            disabled={isSubmitting}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Previsualización del Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h3 className="font-medium text-gray-700">Cliente</h3>
              <p>{formData.clientName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Embarcación</h3>
              <p>{formData.vesselName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Fecha y Hora</h3>
              <p>{new Date(formData.startDateTime).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Detalle</h3>
              <p className="whitespace-pre-wrap">{formData.details}</p>
            </div>
            {selectedPhoto && (
              <div>
                <h3 className="font-medium text-gray-700">Foto</h3>
                <img
                  src={selectedPhoto}
                  alt="Preview"
                  className="mt-2 w-full max-w-md rounded-lg shadow-sm"
                />
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
