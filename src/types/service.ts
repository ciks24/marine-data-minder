
export interface MarineService {
  id: string;
  clientName: string;
  vesselName: string;
  startDateTime: string;
  details: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export type ServiceFormData = Omit<MarineService, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;
