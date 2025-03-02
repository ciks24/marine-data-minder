
import * as XLSX from 'xlsx';
import { MarineService } from '@/types/service';

type ExportTimeRange = 'today' | 'week' | 'month' | 'all' | 'selected';

export const exportToExcel = (services: MarineService[], timeRange: ExportTimeRange = 'all', selectedIds: string[] = []) => {
  // Filter services based on time range
  const filtered = filterServicesByTimeRange(services, timeRange, selectedIds);
  
  if (filtered.length === 0) {
    throw new Error('No hay registros para exportar en el rango seleccionado');
  }
  
  // Convert data to workbook format
  const worksheetData = filtered.map(service => ({
    'Nombre de Cliente': service.clientName,
    'Embarcación': service.vesselName,
    'Fecha y Hora': new Date(service.startDateTime).toLocaleString('es-ES'),
    'Detalle': service.details,
    'Cantidad de Fotos': getPhotosCount(service),
    'Enlaces a Fotos': getPhotoLinks(service).join(', ')
  }));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
  
  // Generate filename based on time range
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  let filename = `registros_servicios_${timestamp}`;
  
  if (timeRange === 'today') {
    filename = `registros_hoy_${timestamp}`;
  } else if (timeRange === 'week') {
    filename = `registros_semana_${timestamp}`;
  } else if (timeRange === 'month') {
    filename = `registros_mes_${timestamp}`;
  } else if (timeRange === 'selected') {
    filename = `registros_seleccionados_${timestamp}`;
  }
  
  // Download the Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const filterServicesByTimeRange = (
  services: MarineService[], 
  timeRange: ExportTimeRange, 
  selectedIds: string[]
): MarineService[] => {
  if (timeRange === 'selected' && selectedIds.length > 0) {
    return services.filter(service => selectedIds.includes(service.id));
  }
  
  if (timeRange === 'all') {
    return [...services];
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (timeRange === 'today') {
    return services.filter(service => {
      const serviceDate = new Date(service.startDateTime);
      return serviceDate >= today;
    });
  }
  
  if (timeRange === 'week') {
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return services.filter(service => {
      const serviceDate = new Date(service.startDateTime);
      return serviceDate >= oneWeekAgo;
    });
  }
  
  if (timeRange === 'month') {
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return services.filter(service => {
      const serviceDate = new Date(service.startDateTime);
      return serviceDate >= oneMonthAgo;
    });
  }
  
  return services;
};

const getPhotosCount = (service: MarineService): number => {
  let count = 0;
  
  if (service.photoUrl && service.photoUrl.trim() !== '') {
    count++;
  }
  
  if (service.photoUrls && service.photoUrls.length > 0) {
    // Count unique photos (avoiding duplicates with photoUrl)
    service.photoUrls.forEach(url => {
      if (url !== service.photoUrl) {
        count++;
      }
    });
  }
  
  return count;
};

const getPhotoLinks = (service: MarineService): string[] => {
  const links: string[] = [];
  
  if (service.photoUrl && service.photoUrl.trim() !== '') {
    links.push(service.photoUrl);
  }
  
  if (service.photoUrls && service.photoUrls.length > 0) {
    service.photoUrls.forEach(url => {
      if (!links.includes(url)) {
        links.push(url);
      }
    });
  }
  
  return links;
};
