
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
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

interface RecordCardProps {
  service: MarineService;
  onEdit: (service: MarineService) => void;
  onDelete: (id: string) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ service, onEdit, onDelete }) => {
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card key={service.id} className="relative flex flex-col card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground">{service.vesselName}</CardTitle>
        <CardDescription>{service.clientName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow pb-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Fecha y Hora</p>
          <p className="text-sm">{formatDateTime(service.startDateTime)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Detalle</p>
          <p className="text-sm">{service.details}</p>
        </div>
        {service.photoUrl && (
          <img
            src={service.photoUrl}
            alt="Servicio"
            className="w-full h-40 object-cover rounded-md"
            onError={(e) => {
              // Si la imagen no carga, mostrar imagen de respaldo
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
            }}
          />
        )}
        {!service.synced && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20">
              Pendiente
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 mt-auto pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(service)}
          className="h-8 px-2 text-xs"
        >
          <Edit2 className="h-3.5 w-3.5 mr-1" />
          Editar
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
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
  );
};

export default RecordCard;
