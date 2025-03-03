
import React from 'react';
import { ServiceFormData } from '@/types/service';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface ServiceFormFieldsProps {
  register: UseFormRegister<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
  isSubmitting: boolean;
}

const ServiceFormFields: React.FC<ServiceFormFieldsProps> = ({ 
  register, 
  errors, 
  isSubmitting 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="clientName">Nombre de Cliente</Label>
        <Input
          id="clientName"
          {...register('clientName', { required: 'Este campo es requerido' })}
          className="form-input"
          placeholder="Ingrese el nombre del cliente"
          disabled={isSubmitting}
        />
        {errors.clientName && (
          <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="vesselName">Embarcación</Label>
        <Input
          id="vesselName"
          {...register('vesselName', { required: 'Este campo es requerido' })}
          className="form-input"
          placeholder="Ingrese el nombre de la embarcación"
          disabled={isSubmitting}
        />
        {errors.vesselName && (
          <p className="mt-1 text-sm text-red-600">{errors.vesselName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="startDateTime">Fecha y Hora de Inicio</Label>
        <Input
          id="startDateTime"
          type="datetime-local"
          {...register('startDateTime', { required: 'Este campo es requerido' })}
          className="form-input"
          disabled={true}
          readOnly={true}
        />
        {errors.startDateTime && (
          <p className="mt-1 text-sm text-red-600">{errors.startDateTime.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="details">Detalle</Label>
        <Textarea
          id="details"
          {...register('details', { required: 'Este campo es requerido' })}
          className="form-input min-h-[100px]"
          placeholder="Ingrese los detalles del servicio"
          disabled={isSubmitting}
        />
        {errors.details && (
          <p className="mt-1 text-sm text-red-600">{errors.details.message}</p>
        )}
      </div>
    </div>
  );
};

export default ServiceFormFields;
