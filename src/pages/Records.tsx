
import { useState, useEffect } from 'react';
import { Edit2, Trash2, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import type { MarineService } from '../types/service';

const Records = () => {
  const [services, setServices] = useState<MarineService[]>([]);

  useEffect(() => {
    const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
    setServices(loadedServices);
  }, []);

  const handleDelete = (id: string) => {
    const updatedServices = services.filter(service => service.id !== id);
    localStorage.setItem('services', JSON.stringify(updatedServices));
    setServices(updatedServices);
    toast.success('Registro eliminado');
  };

  const syncServices = () => {
    // Aquí iría la lógica de sincronización con el servidor
    toast.success('Registros sincronizados exitosamente');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Registros de Servicios</h1>
        <Button onClick={syncServices} variant="outline" className="flex items-center gap-2">
          <ArrowUpCircle className="h-4 w-4" />
          Sincronizar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="relative">
            <CardHeader>
              <CardTitle className="text-lg">{service.vesselName}</CardTitle>
              <CardDescription>{service.clientName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha y Hora</p>
                <p>{new Date(service.startDateTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Detalle</p>
                <p className="text-sm">{service.details}</p>
              </div>
              {service.photoUrl && (
                <img
                  src={service.photoUrl}
                  alt="Servicio"
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              {!service.synced && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    No sincronizado
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
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
                    <AlertDialogAction onClick={() => handleDelete(service.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay registros disponibles</p>
        </div>
      )}
    </div>
  );
};

export default Records;
