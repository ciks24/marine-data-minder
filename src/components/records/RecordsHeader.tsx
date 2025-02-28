
import React from 'react';
import { ArrowUpCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";

interface RecordsHeaderProps {
  isOnline: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSync: () => Promise<void>;
}

const RecordsHeader: React.FC<RecordsHeaderProps> = ({ 
  isOnline, 
  isSyncing, 
  isLoading, 
  onRefresh, 
  onSync 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Registros de Servicios</h1>
        <div className="flex items-center mt-1">
          <span className="text-sm text-muted-foreground mr-1">Estado:</span>
          {isOnline ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 dark:bg-green-500/20 flex items-center space-x-1">
              <Wifi className="h-3 w-3" />
              <span>Conectado</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 flex items-center space-x-1">
              <WifiOff className="h-3 w-3" />
              <span>Sin conexión</span>
            </Badge>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={!isOnline || isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
        <Button 
          onClick={onSync} 
          variant="default" 
          className="flex items-center gap-2"
          disabled={!isOnline || isSyncing}
        >
          <ArrowUpCircle className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sincronizar</span>
        </Button>
      </div>
    </div>
  );
};

export default RecordsHeader;
