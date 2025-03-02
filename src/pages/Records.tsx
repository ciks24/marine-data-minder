
import React, { useState } from 'react';
import { useRecordsSync } from '@/hooks/useRecordsSync';
import RecordCard from '@/components/records/RecordCard';
import RecordsHeader from '@/components/records/RecordsHeader';
import EditServiceDialog from '@/components/records/EditServiceDialog';

const Records = () => {
  const {
    services,
    isSyncing,
    isLoading,
    isOnline,
    editingService,
    isEditing,
    isSubmitting,
    setIsEditing,
    setEditingService,
    syncServices,
    refreshServices,
    handleEdit,
    handleUpdate,
    handleDelete
  } = useRecordsSync();
  
  const [filterValue, setFilterValue] = useState('');
  
  const filteredServices = filterValue 
    ? services.filter(service => 
        service.clientName.toLowerCase().includes(filterValue.toLowerCase()) ||
        service.vesselName.toLowerCase().includes(filterValue.toLowerCase())
      )
    : services;

  return (
    <div className="space-y-6">
      <RecordsHeader 
        isOnline={isOnline}
        isSyncing={isSyncing}
        isRefreshing={isLoading}
        onRefresh={refreshServices}
        onSync={syncServices}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        onClearFilter={() => setFilterValue('')}
        services={services}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <RecordCard 
            key={service.id}
            service={service}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {filterValue 
              ? "No se encontraron resultados para tu búsqueda" 
              : "No hay registros disponibles"}
          </p>
        </div>
      )}

      <EditServiceDialog 
        open={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) setEditingService(null);
        }}
        service={editingService}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Records;
