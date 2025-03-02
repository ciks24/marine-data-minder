import ExcelJS from 'exceljs';
import { MarineService } from '@/types/service';

type ExportTimeRange = 'today' | 'week' | 'month' | 'all' | 'selected' | 'byClient';

export const exportToExcel = async (services: MarineService[], timeRange: ExportTimeRange = 'all', selectedIds: string[] = []) => {
  // Filter services based on time range
  const filtered = filterServicesByTimeRange(services, timeRange, selectedIds);
  
  if (filtered.length === 0) {
    throw new Error('No hay registros para exportar en el rango seleccionado');
  }

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registros');

  // Define columns
  worksheet.columns = [
    { header: 'Nombre de Cliente', key: 'clientName', width: 30 },
    { header: 'Embarcación', key: 'vesselName', width: 30 },
    { header: 'Fecha y Hora', key: 'startDateTime', width: 20 },
    { header: 'Detalle', key: 'details', width: 50 },
    { header: 'Cantidad de Fotos', key: 'photosCount', width: 15 },
    { header: 'Enlaces a Fotos', key: 'photoLinks', width: 50 }
  ];

  // Add style to header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data
  filtered.forEach(service => {
    worksheet.addRow({
      clientName: service.clientName,
      vesselName: service.vesselName,
      startDateTime: new Date(service.startDateTime).toLocaleString('es-ES'),
      details: service.details,
      photosCount: getPhotosCount(service),
      photoLinks: getPhotoLinks(service).join(', ')
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.width && column.width < 12) column.width = 12;
  });

  // Generate filename based on time range
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  let filename = `registros_servicios_${timestamp}`;
  
  if (timeRange === 'today') {
    filename = `registros_hoy_${timestamp}`;
  } else if (timeRange === 'byClient' && filtered.length > 0) {
    filename = `registros_cliente_${filtered[0].clientName}_${timestamp}`;
  }

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
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
