
export interface MarineService {
  id: string;
  clientName: string;
  vesselName: string;
  startDateTime: string;
  details: string;
  photoUrl?: string; // Keep for backward compatibility
  photoUrls?: string[]; // New field for multiple photos
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export type ServiceFormData = Omit<MarineService, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;
