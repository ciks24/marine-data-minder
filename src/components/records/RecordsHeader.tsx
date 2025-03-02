
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterX, Plus, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MarineService } from '@/types/service';
import ExportDialog from './ExportDialog';

interface RecordsHeaderProps {
  onNewRecord: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
  onFilterChange: (value: string) => void;
  filterValue: string;
  onClearFilter: () => void;
  services: MarineService[];
}

const RecordsHeader: React.FC<RecordsHeaderProps> = ({
  onNewRecord,
  onRefresh,
  isRefreshing,
  isOnline,
  onFilterChange,
  filterValue,
  onClearFilter,
  services
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex-1 w-full">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Buscar por cliente o embarcación..."
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full pr-10"
            />
            {filterValue && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={onClearFilter}
              >
                <FilterX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={!isOnline || isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Actualizar</span>
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
          
          <Button
            variant="default"
            size="sm"
            onClick={onNewRecord}
            className="h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Nuevo</span>
          </Button>
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
