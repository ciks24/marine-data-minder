
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
import { Download, X } from 'lucide-react';
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
      
      if (exportOption === 'today') {
        await exportToExcel(services, 'today');
      } else if (exportOption === 'byClient' && selectedClient) {
        // Filtrar servicios por cliente seleccionado
        const filteredServices = services.filter(s => s.clientName === selectedClient);
        await exportToExcel(filteredServices, 'all', []);
      }
      
      toast.success('Registros exportados exitosamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(error instanceof Error ? error.message : 'Error al exportar los registros');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="app-title">Exportar Registros</DialogTitle>
          <DialogDescription>
            Selecciona cómo deseas exportar los registros
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
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
