
import React from 'react';
import { ServiceFormData } from '@/types/service';
import { Button } from '../ui/button';
import { Save, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';

interface ServicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ServiceFormData;
  selectedPhotos: string[];
  photosToRemove: number[];
  onSubmit: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
}

const ServicePreviewDialog: React.FC<ServicePreviewDialogProps> = ({
  open,
  onOpenChange,
  formData,
  selectedPhotos,
  photosToRemove,
  onSubmit,
  isSubmitting,
  isEditMode
}) => {
  const isPhotoMarkedForRemoval = (index: number) => photosToRemove.includes(index);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onSubmit();
              onOpenChange(false);
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
  );
};

export default ServicePreviewDialog;
