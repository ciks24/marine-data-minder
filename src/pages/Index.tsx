import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ServiceForm from '../components/ServiceForm';
import { syncService } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import type { ServiceFormData, MarineService } from '../types/service';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      setIsSubmitting(true);
      
      // Crear nuevo servicio con los datos del formulario
      const newService: MarineService = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false
      };

      // Guardar en almacenamiento local
      try {
        const services = JSON.parse(localStorage.getItem('services') || '[]');
        services.push(newService);
        localStorage.setItem('services', JSON.stringify(services));
      } catch (localError) {
        console.error('Error guardando en localStorage:', localError);
        toast.error('Error al guardar localmente. Verifique el espacio disponible.');
        return;
      }

      // Intentar sincronizar con Supabase si hay conexión
      if (navigator.onLine && user) {
        try {
          const syncedService = await syncService.saveService(newService);
          
          if (syncedService) {
            // Actualizar el servicio en localStorage con la versión sincronizada
            const services = JSON.parse(localStorage.getItem('services') || '[]');
            const updatedServices = services.map(s => 
              s.id === syncedService.id ? syncedService : s
            );
            localStorage.setItem('services', JSON.stringify(updatedServices));
            toast.success('Servicio registrado y sincronizado exitosamente');
          } else {
            toast.warning('Servicio guardado localmente, pero no se pudo sincronizar');
          }
        } catch (syncError: any) {
          console.error('Error sincronizando con Supabase:', syncError);
          toast.error(`Error al sincronizar: ${syncError.message || 'Error desconocido'}`);
          return;
        }
      } else {
        toast.info('Servicio guardado localmente. Se sincronizará cuando haya conexión');
      }

      navigate('/records');
    } catch (error: any) {
      console.error('Error general guardando servicio:', error);
      toast.error(`Error al guardar el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nuevo Registro de Servicio</h1>
        <ServiceForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
};

export default Index;
