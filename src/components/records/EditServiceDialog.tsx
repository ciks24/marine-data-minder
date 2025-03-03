
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServiceForm from '../ServiceForm';
import { MarineService, ServiceFormData } from '@/types/service';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MarineService | null;
  onUpdate: (data: ServiceFormData) => Promise<void>;
  isSubmitting: boolean;
}

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({
  open,
  onOpenChange,
  service,
  onUpdate,
  isSubmitting
}) => {
  if (!service) return null;

  // Prepare unique photo URLs from the service
  const prepareUniquePhotoUrls = () => {
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

  const uniquePhotoUrls = prepareUniquePhotoUrls();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl app-title">Editar Registro</DialogTitle>
        </DialogHeader>
        
        <ServiceForm 
          initialData={{
            clientName: service.clientName,
            vesselName: service.vesselName,
            startDateTime: service.startDateTime,
            details: service.details,
            photoUrl: uniquePhotoUrls.length > 0 ? uniquePhotoUrls[0] : '',
            photoUrls: uniquePhotoUrls
          }}
          onSubmit={onUpdate}
          isSubmitting={isSubmitting}
          isEditMode={true}
          serviceId={service.id}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceDialog;
