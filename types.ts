
export type ShowName = 
  | 'Correspondents'
  | 'DC Insiders'
  | 'Finding Formosa'
  | 'In Case You Missed It'
  | 'Zoom In, Zoom Out'
  | 'Special Program';

export type EditorName = 'Dolphine' | 'Eason' | 'James';

export interface Task {
  id: string;
  show: string;
  episode: string;
  editor: string;
  startDate: string;
  endDate: string;
  notes?: string;
  lastEditedBy?: string;
  lastEditedAt: string; // 強制要求，用於衝突比對
  version: number;      // 用於版本控制
}

export interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'join' | 'sync';
  userName: string;
  targetTask?: string;
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
  // Fix: Added missing date fields required by ProgramManager
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
  avatar?: string;
  isOnline?: boolean;
  updatedAt: string;
}

export interface FilterState {
  shows: string[];
  editors: string[];
}

export interface WorkspaceSettings {
  id: string;
  companyName: string;
  logoUrl?: string;
  workingDays: number[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
}
