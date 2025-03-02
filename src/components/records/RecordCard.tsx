import React from 'react';
import { Edit2, Trash2, Image } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { MarineService } from '@/types/service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface RecordCardProps {
  service: MarineService;
  onEdit: (service: MarineService) => void;
  onDelete: (id: string) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ service, onEdit, onDelete }) => {
  const [photoDialogOpen, setPhotoDialogOpen] = React.useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);
  
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
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 min-w-[60px]"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] w-[95vw] max-h-[90vh] p-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base">{service.vesselName}</DialogTitle>
            <DialogDescription className="text-xs">
              Foto {selectedPhotoIndex + 1} de {photoUrls.length}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-2">
            {photoUrls.length > 0 && (
              <img
                src={photoUrls[selectedPhotoIndex]}
                alt={`Foto ${selectedPhotoIndex + 1}`}
                className="max-h-[60vh] w-full object-contain rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
                }}
              />
            )}
          </div>
          {photoUrls.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={handlePrevPhoto} className="h-8 px-3 text-xs">
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextPhoto} className="h-8 px-3 text-xs">
                Siguiente
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setPhotoDialogOpen(false)} className="h-8 px-3 text-xs w-full sm:w-auto">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecordCard;
