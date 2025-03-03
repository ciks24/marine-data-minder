
import ExcelJS from 'exceljs';
import { MarineService } from '@/types/service';

type ExportTimeRange = 'today' | 'week' | 'month' | 'all' | 'selected' | 'byClient';

// Función auxiliar para formatear la fecha y hora
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  // Ajustar a la zona horaria local
  const localDate = new Date(date.getTime());
  return localDate.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Función para descargar una imagen desde una URL y convertirla en un buffer
const getImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching image: ${response.statusText}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!reader.result) {
          reject(new Error('Failed to read image'));
          return;
        }
        // Convertir la imagen a un buffer que ExcelJS pueda usar
        const buffer = Buffer.from(reader.result as ArrayBuffer);
        resolve(buffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  } catch (error) {
    console.error('Error converting image to buffer:', error);
    return null;
  }
};

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
    { header: 'Fecha y Hora', key: 'startDateTime', width: 25 },
    { header: 'Detalle', key: 'details', width: 50 },
    { header: 'Fotos', key: 'photos', width: 50 },
  ];

  // Add style to header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data
  for (const service of filtered) {
    // Añadir la fila de datos básicos
    const rowNumber = worksheet.rowCount + 1;
    worksheet.addRow({
      clientName: service.clientName,
      vesselName: service.vesselName,
      startDateTime: formatDateTime(service.startDateTime),
      details: service.details,
      photos: '' // Esta celda se ajustará para mostrar imágenes
    });
    
    // Recopilar todas las URLs únicas de imágenes
    const photoUrls = getPhotoLinks(service);
    
    if (photoUrls.length > 0) {
      // Ajustar la altura de la fila para acomodar las imágenes
      worksheet.getRow(rowNumber).height = 120;
      
      // Añadir imágenes a la celda de fotos
      for (let i = 0; i < photoUrls.length; i++) {
        try {
          const imageBuffer = await getImageBuffer(photoUrls[i]);
          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'jpeg', // o detectar la extensión correcta
            });
            
            // Calcular posición para colocar la imagen en la celda
            const margin = i * 140; // Espacio horizontal entre imágenes
            
            worksheet.addImage(imageId, {
              tl: { col: 4, row: rowNumber - 1 },
              ext: { width: 120, height: 100 },
              editAs: 'oneCell',
              hyperlinks: {
                hyperlink: photoUrls[i],
                tooltip: `Foto ${i+1}`
              }
            });
          }
        } catch (error) {
          console.error(`Error adding image ${i+1} for service ${service.id}:`, error);
          // Añadir texto alternativo en caso de error
          const cell = worksheet.getCell(`E${rowNumber}`);
          if (cell.value) {
            cell.value = `${cell.value}, [Error con foto ${i+1}]`;
          } else {
            cell.value = `[Error con foto ${i+1}]`;
          }
        }
      }
    }
  }

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
      const serviceDateOnly = new Date(
        serviceDate.getFullYear(),
        serviceDate.getMonth(),
        serviceDate.getDate()
      );
      return serviceDateOnly.getTime() === today.getTime();
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
