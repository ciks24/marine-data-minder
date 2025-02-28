
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
      const services = JSON.parse(localStorage.getItem('services') || '[]');
      services.push(newService);
      localStorage.setItem('services', JSON.stringify(services));

      // Intentar sincronizar con Supabase si hay conexión
      if (navigator.onLine && user) {
        const syncedService = await syncService.saveService(newService);
        
        if (syncedService) {
          // Actualizar el servicio en localStorage con la versión sincronizada
          const updatedServices = services.map(s => 
            s.id === syncedService.id ? syncedService : s
          );
          localStorage.setItem('services', JSON.stringify(updatedServices));
          toast.success('Servicio registrado y sincronizado exitosamente');
        } else {
          toast.warning('Servicio guardado localmente, pero no se pudo sincronizar');
        }
      } else {
        toast.info('Servicio guardado localmente. Se sincronizará cuando haya conexión');
      }

      navigate('/records');
    } catch (error) {
      toast.error('Error al guardar el servicio');
      console.error('Error saving service:', error);
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
