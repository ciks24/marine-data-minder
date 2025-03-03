
import React, { useState, useEffect } from 'react';
import { MarineService } from '@/types/service';
import { exportToExcel } from '@/utils/ExcelExport';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, X, Loader2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: MarineService[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  services
}) => {
  const [exportOption, setExportOption] = useState<'today' | 'byClient'>('today');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [clientList, setClientList] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Extraer lista única de clientes
  useEffect(() => {
    if (services.length > 0) {
      const uniqueClients = Array.from(new Set(services.map(s => s.clientName)));
      setClientList(uniqueClients.sort());
      // Seleccionar el primer cliente por defecto
      if (uniqueClients.length > 0 && !selectedClient) {
        setSelectedClient(uniqueClients[0]);
      }
    }
  }, [services]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(10);
      
      // Mostrar toast de inicio
      toast.info('Iniciando exportación. Por favor espere mientras se procesan las imágenes...');
      
      // Pequeña pausa para permitir que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setProgress(30);
      
      if (exportOption === 'today') {
        await exportToExcel(services, 'today');
      } else if (exportOption === 'byClient' && selectedClient) {
        // Filtrar servicios por cliente seleccionado
        const filteredServices = services.filter(s => s.clientName === selectedClient);
        setProgress(60);
        await exportToExcel(filteredServices, 'all', []);
      }
      
      setProgress(100);
      toast.success('Registros exportados exitosamente con imágenes incluidas');
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(error instanceof Error ? error.message : 'Error al exportar los registros');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="app-title">Exportar Registros</DialogTitle>
          <DialogDescription>
            Selecciona cómo deseas exportar los registros. Las imágenes se incluirán directamente en el archivo Excel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            defaultValue="today" 
            value={exportOption}
            onValueChange={(value) => setExportOption(value as 'today' | 'byClient')}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="today" id="today" />
              <Label htmlFor="today">Registros de hoy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="byClient" id="byClient" />
              <Label htmlFor="byClient">Registros por cliente</Label>
            </div>
          </RadioGroup>
          
          {exportOption === 'byClient' && (
            <div className="mt-4">
              <Label htmlFor="clientSelect">Selecciona un cliente</Label>
              <Select
                value={selectedClient}
                onValueChange={setSelectedClient}
                disabled={clientList.length === 0}
              >
                <SelectTrigger id="clientSelect" className="w-full mt-1">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientList.map(client => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {isExporting && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Procesando imágenes... {progress}%
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || (exportOption === 'byClient' && !selectedClient)}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
