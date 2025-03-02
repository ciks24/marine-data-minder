
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterX, Plus, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MarineService } from '@/types/service';
import ExportDialog from './ExportDialog';

interface RecordsHeaderProps {
  onNewRecord?: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  isSyncing?: boolean; // Added this property
  isOnline: boolean;
  onFilterChange?: (value: string) => void;
  filterValue?: string;
  onClearFilter?: () => void;
  services?: MarineService[];
  onSync?: () => void; // Added this property
}

const RecordsHeader: React.FC<RecordsHeaderProps> = ({
  onNewRecord,
  onRefresh,
  isRefreshing = false,
  isSyncing = false, // Default to false
  isOnline,
  onFilterChange,
  filterValue = '',
  onClearFilter,
  services = [],
  onSync
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Determine which loading state to use (backwards compatibility)
  const isLoading = isSyncing || isRefreshing;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex-1 w-full">
          {onFilterChange && (
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Buscar por cliente o embarcación..."
                value={filterValue}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full pr-10"
              />
              {filterValue && onClearFilter && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={onClearFilter}
                >
                  <FilterX className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={!isOnline || isLoading}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Actualizar</span>
          </Button>

          {onSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={!isOnline || isLoading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Sincronizar</span>
            </Button>
          )}

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
