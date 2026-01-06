
export type ShowName = 'Correspondents' | 'DC Insiders' | 'Finding Formosa' | 'In Case You Missed It' | 'Zoom In, Zoom Out' | 'Special Program';
export type EditorName = 'Dolphine' | 'Eason' | 'James';

export interface Task {
  id: string;
  show: string;
  episode: string;
  editor: string;
  startDate: string;
  endDate: string;
  notes?: string;
  lastEditedAt: string;
  version: number;
}

export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'join' | 'sync';
  userName: string;
  timestamp: string;
  details: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  updatedAt: string;
  productionDate?: string;
  deliveryDate?: string;
  premiereDate?: string;
}

export interface Editor {
  id: string;
  name: string;
  role: string;
  color: string;
  notes: string;
  updatedAt: string;
}

export interface FilterState {
  shows: string[];
  editors: string[];
}

export interface WorkspaceSettings {
  id: string;
  companyName: string;
  workingDays: number[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
  googleSheetId?: string;
}
