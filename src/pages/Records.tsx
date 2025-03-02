
import React from 'react';
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

  return (
    <div className="space-y-6">
      <RecordsHeader 
        isOnline={isOnline}
        isSyncing={isSyncing}
        isRefreshing={isLoading}
        onRefresh={refreshServices}
        onSync={syncServices}
        services={services}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <RecordCard 
            key={service.id}
            service={service}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay registros disponibles
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
