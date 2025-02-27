
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ServiceForm from '../components/ServiceForm';
import type { ServiceFormData, MarineService } from '../types/service';

const Index = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      // En una implementación real, aquí manejaríamos la lógica de sincronización
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

      toast.success('Servicio registrado exitosamente');
      navigate('/records');
    } catch (error) {
      toast.error('Error al guardar el servicio');
      console.error('Error saving service:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Nuevo Registro de Servicio</h1>
        <ServiceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default Index;
