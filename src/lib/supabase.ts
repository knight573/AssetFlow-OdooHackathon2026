import { createClient } from '@supabase/supabase-js';
import { 
  Asset, 
  Allocation, 
  TransferRequest, 
  Profile, 
  Department, 
  Category, 
  ActivityLog, 
  Notification 
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Helper to safely load data from LocalStorage
function getStored<T>(key: string): T[] {
  const data = localStorage.getItem(`assetflow_${key}`);
  return data ? JSON.parse(data) : [];
}

function setStored<T>(key: string, data: T[]): void {
  localStorage.setItem(`assetflow_${key}`, JSON.stringify(data));
  // Dispatch custom event to trigger reactivity in mock listeners
  window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: key } }));
}

// Local Database State API Wrapper (Database Simulator for Demo)
// This maps directly to P2's localDb to maintain compatibility with their files.
export const localDb = {
  getDepartments: () => getStored<Department>('departments'),
  getCategories: () => getStored<Category>('categories'),
  getProfiles: () => getStored<Profile>('profiles'),
  getAssets: () => getStored<Asset>('assets'),
  getAllocations: () => getStored<Allocation>('allocations'),
  getTransfers: () => getStored<TransferRequest>('transfers'), // mapping transfers key
  getActivityLogs: () => getStored<ActivityLog>('activity_logs'),
  getNotifications: () => getStored<Notification>('notifications'),

  saveAssets: (assets: Asset[]) => setStored<Asset>('assets', assets),
  saveAllocations: (allocations: Allocation[]) => setStored<Allocation>('allocations', allocations),
  saveTransfers: (transfers: TransferRequest[]) => setStored<TransferRequest>('transfers', transfers),
  saveActivityLogs: (logs: ActivityLog[]) => setStored<ActivityLog>('activity_logs', logs),
  saveNotifications: (notes: Notification[]) => setStored<Notification>('notifications', notes),
  saveProfiles: (profiles: Profile[]) => setStored<Profile>('profiles', profiles),
};
