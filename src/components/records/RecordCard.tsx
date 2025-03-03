
import React, { useState } from 'react';
import { Edit2, Image } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { MarineService } from '@/types/service';
import PhotoDialog from './PhotoDialog';
import DeleteServiceConfirmation from './DeleteServiceConfirmation';

interface RecordCardProps {
  service: MarineService;
  onEdit: (service: MarineService) => void;
  onDelete: (id: string) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ service, onEdit, onDelete }) => {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    // Convertir a la zona horaria local del usuario
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get all photo URLs (handle both legacy and new format)
  const getPhotoUrls = () => {
    const photos: string[] = [];
    if (service.photoUrl && service.photoUrl.trim() !== '') {
      photos.push(service.photoUrl);
    }
    if (service.photoUrls && service.photoUrls.length > 0) {
      service.photoUrls.forEach(url => {
        if (!photos.includes(url)) {
          photos.push(url);
        }
      });
    }
    return photos;
  };

  const photoUrls = getPhotoUrls();
  const hasMultiplePhotos = photoUrls.length > 1;
  const firstPhoto = photoUrls.length > 0 ? photoUrls[0] : null;

  const openPhotoDialog = (index: number) => {
    setSelectedPhotoIndex(index);
    setPhotoDialogOpen(true);
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prevIndex) => (prevIndex + 1) % photoUrls.length);
  };

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prevIndex) => (prevIndex - 1 + photoUrls.length) % photoUrls.length);
  };

  return (
    <>
      <Card key={service.id} className="relative flex flex-col card-hover max-w-full">
        <CardHeader className="pb-2 px-3 py-2">
          <CardTitle className="text-base text-foreground">{service.vesselName}</CardTitle>
          <CardDescription className="text-sm">{service.clientName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 flex-grow pb-2 px-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fecha y Hora</p>
            <p className="text-xs">{formatDateTime(service.startDateTime)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Detalle</p>
            <p className="text-xs line-clamp-3">{service.details}</p>
          </div>
          {firstPhoto && (
            <div className="relative">
              <img
                src={firstPhoto}
                alt="Servicio"
                className="w-full h-32 object-cover rounded-md cursor-pointer"
                onClick={() => openPhotoDialog(0)}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
                }}
              />
              {hasMultiplePhotos && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-md text-xs flex items-center">
                  <Image className="w-3 h-3 mr-1" />
                  {photoUrls.length}
                </div>
              )}
            </div>
          )}
          {!service.synced && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 text-xs py-0.5">
                Pendiente
              </Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 mt-auto pt-2 px-3 py-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(service)}
            className="h-7 px-2 text-xs min-w-[60px]"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Editar
          </Button>
          
          <DeleteServiceConfirmation 
            serviceId={service.id} 
            onDelete={onDelete} 
          />
        </CardFooter>
      </Card>

      <PhotoDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        photos={photoUrls}
        selectedIndex={selectedPhotoIndex}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        title={service.vesselName}
      />
    </>
  );
};

export default RecordCard;
