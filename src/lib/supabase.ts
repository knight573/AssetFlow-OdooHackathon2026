import { createClient } from '@supabase/supabase-js';
import type { 
  Asset, 
  Allocation, 
  TransferRequest, 
  Profile, 
  Department, 
  Category, 
  ActivityLog, 
  Notification 
} from './types';
import { getMockData, setMockData } from './mockDb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Local Database State API Wrapper - Unified with P3's mockDb
export const localDb = {
  getDepartments: () => getMockData<Department>('departments'),
  getCategories: () => getMockData<Category>('categories'),
  getProfiles: () => getMockData<Profile>('profiles'),
  getAssets: () => getMockData<Asset>('assets'),
  getAllocations: () => getMockData<Allocation>('allocations'),
  getTransfers: () => getMockData<TransferRequest>('transfer_requests'),
  getActivityLogs: () => getMockData<ActivityLog>('activity_logs'),
  getNotifications: () => getMockData<Notification>('notifications'),

  saveAssets: (assets: Asset[]) => setMockData<Asset>('assets', assets),
  saveAllocations: (allocations: Allocation[]) => setMockData<Allocation>('allocations', allocations),
  saveTransfers: (transfers: TransferRequest[]) => setMockData<TransferRequest>('transfer_requests', transfers),
  saveActivityLogs: (logs: ActivityLog[]) => setMockData<ActivityLog>('activity_logs', logs),
  saveNotifications: (notes: Notification[]) => setMockData<Notification>('notifications', notes),
  saveProfiles: (profiles: Profile[]) => setMockData<Profile>('profiles', profiles),
};
