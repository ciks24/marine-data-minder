
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServiceForm from '../ServiceForm';
import { MarineService, ServiceFormData } from '@/types/service';
import { prepareUniquePhotoUrls } from '@/utils/photoUtils';

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

  const uniquePhotoUrls = prepareUniquePhotoUrls(service);
  console.log('Photos en EditServiceDialog:', uniquePhotoUrls);

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
