import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Camera } from 'lucide-react';
import { MarineService } from '@/types/service';
import ExportDialog from './ExportDialog';

interface RecordsHeaderProps {
  onNewRecord?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isSyncing?: boolean;
  isOnline: boolean;
  services?: MarineService[];
  onSync?: () => void;
  hasOfflineChanges?: boolean;
}

const RecordsHeader: React.FC<RecordsHeaderProps> = ({
  onNewRecord,
  onRefresh,
  isRefreshing = false,
  isSyncing = false,
  isOnline,
  services = [],
  onSync,
  hasOfflineChanges = false
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Determine which loading state to use
  const isLoading = isSyncing || isRefreshing;

  return (
    <>
      <div className="flex justify-end items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await onRefresh();
            if (onSync) await onSync();
          }}
          disabled={!isOnline || isLoading}
          className={`h-9 ${hasOfflineChanges ? 'border-yellow-500 hover:border-yellow-600' : ''}`}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''} ${hasOfflineChanges ? 'text-yellow-500' : ''}`} />
          <span className="hidden xs:inline">
            {hasOfflineChanges ? 'Sincronizar cambios' : 'Sincronizar'}
          </span>
          {hasOfflineChanges && !isOnline && (
            <span className="ml-1 bg-yellow-500 text-white text-xs px-1 rounded">!</span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportDialogOpen(true)}
          className="h-9"
        >
          <Download className="h-4 w-4 mr-1" />
          <span className="hidden xs:inline">Exportar</span>
        </Button>
        
        {onNewRecord && (
          <Button
            variant="default"
            size="sm"
            onClick={onNewRecord}
            className="h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Nuevo</span>
          </Button>
        )}
      </div>
      
      <ExportDialog 
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        services={services}
      />
    </>
  );
};

export default RecordsHeader;
