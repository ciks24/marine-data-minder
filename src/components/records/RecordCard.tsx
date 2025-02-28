
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
  return (
    <Card key={service.id} className="relative flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{service.vesselName}</CardTitle>
        <CardDescription>{service.clientName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Fecha y Hora</p>
          <p>{new Date(service.startDateTime).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Detalle</p>
          <p className="text-sm">{service.details}</p>
        </div>
        {service.photoUrl && (
          <img
            src={service.photoUrl}
            alt="Servicio"
            className="w-full h-48 object-cover rounded-md"
            onError={(e) => {
              // Si la imagen no carga, mostrar imagen de respaldo
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
            }}
          />
        )}
        {!service.synced && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20">
              No sincronizado
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 mt-auto">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => onEdit(service)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash2 className="h-4 w-4" />
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
              <AlertDialogAction onClick={() => onDelete(service.id)}>
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
