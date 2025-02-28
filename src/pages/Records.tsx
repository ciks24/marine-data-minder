
import { useState, useEffect } from 'react';
import { Edit2, Trash2, ArrowUpCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { syncService, useOnlineStatus } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { MarineService } from '../types/service';

const Records = () => {
  const [services, setServices] = useState<MarineService[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();
  const { user } = useAuth();

  // Cargar datos locales al iniciar
  useEffect(() => {
    const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
    setServices(loadedServices);
    setIsLoading(false);
  }, []);

  // Configurar canal de tiempo real para actualizar datos
  useEffect(() => {
    if (!user) return;

    // Suscribirse a cambios en tiempo real en la tabla marine_services
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marine_services'
        },
        async () => {
          // Refrescar datos desde Supabase cuando hay cambios
          if (isOnline) {
            await fetchServicesFromCloud();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOnline]);

  // Intentar sincronizar al recuperar la conexión
  useEffect(() => {
    if (isOnline && user && !isLoading) {
      toast.info('Conexión a Internet detectada. Sincronizando datos...');
      syncServices();
    }
  }, [isOnline, user]);

  // Función para cargar servicios desde Supabase
  const fetchServicesFromCloud = async () => {
    if (!user || !isOnline) return;

    try {
      const cloudServices = await syncService.fetchAllServices();
      
      if (cloudServices.length > 0) {
        // Combinar datos locales y remotos
        const localServices = JSON.parse(localStorage.getItem('services') || '[]');
        
        // Identificar servicios que solo existen localmente
        const localOnlyServices = localServices.filter(
          local => !cloudServices.some(cloud => cloud.id === local.id)
        );
        
        // Combinar servicios de la nube con los que solo existen localmente
        const combinedServices = [...cloudServices, ...localOnlyServices];
        
        // Actualizar datos locales
        localStorage.setItem('services', JSON.stringify(combinedServices));
        setServices(combinedServices);
      }
    } catch (error) {
      console.error('Error al obtener servicios de la nube:', error);
    }
  };

  // Sincronizar servicios con Supabase
  const syncServices = async () => {
    if (!isOnline || !user) {
      toast.error('No hay conexión a Internet. Intente más tarde.');
      return;
    }

    setIsSyncing(true);
    try {
      // Sincronizar servicios no sincronizados
      const syncedServices = await syncService.syncAllServices(services);
      setServices(syncedServices);
      
      // Luego obtener los datos más recientes de la nube
      await fetchServicesFromCloud();
      
      toast.success('Registros sincronizados exitosamente');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      toast.error('Error al sincronizar. Intente nuevamente');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Eliminar localmente
      const updatedServices = services.filter(service => service.id !== id);
      localStorage.setItem('services', JSON.stringify(updatedServices));
      setServices(updatedServices);

      // Intentar eliminar en la nube si hay conexión
      if (isOnline && user) {
        const deleted = await syncService.deleteService(id);
        if (!deleted) {
          toast.warning('El registro se eliminó localmente, pero no en la nube');
        } else {
          toast.success('Registro eliminado completamente');
        }
      } else {
        toast.info('Registro eliminado localmente. Se actualizará en la nube al reconectar');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar el registro');
    }
  };

  const refreshServices = async () => {
    if (!isOnline) {
      toast.error('No hay conexión a Internet para actualizar datos');
      return;
    }
    
    setIsLoading(true);
    try {
      await fetchServicesFromCloud();
      toast.success('Registros actualizados desde la nube');
    } catch (error) {
      toast.error('Error al actualizar desde la nube');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Registros de Servicios</h1>
          <div className="flex items-center mt-1">
            <span className="text-sm text-gray-500 mr-1">Estado:</span>
            {isOnline ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center space-x-1">
                <Wifi className="h-3 w-3" />
                <span>Conectado</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>Sin conexión</span>
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={refreshServices} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={!isOnline || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            onClick={syncServices} 
            variant="default" 
            className="flex items-center gap-2"
            disabled={!isOnline || isSyncing}
          >
            <ArrowUpCircle className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
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
                  onError={(e) => {
                    // Si la imagen no carga, mostrar imagen de respaldo
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
                  }}
                />
              )}
              {!service.synced && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    No sincronizado
                  </Badge>
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
