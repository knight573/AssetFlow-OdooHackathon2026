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

// Read env keys (standard Vite environment keys)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Real client (optional - will be null/unusable if keys aren't set, but we define it so no code errors out)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// FALLBACK DATA STORAGE FOR LOCAL TESTING
// ==========================================

const SEED_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', status: 'active', created_at: new Date().toISOString() },
  { id: 'd2', name: 'Facilities', status: 'active', created_at: new Date().toISOString() },
  { id: 'd3', name: 'IT & Security', status: 'active', created_at: new Date().toISOString() },
  { id: 'd4', name: 'Operations', status: 'active', created_at: new Date().toISOString() },
  { id: 'd5', name: 'Field Ops (East)', status: 'active', created_at: new Date().toISOString() }
];

const SEED_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Laptops', status: 'active', created_at: new Date().toISOString() },
  { id: 'c2', name: 'Monitors', status: 'active', created_at: new Date().toISOString() },
  { id: 'c3', name: 'Office Furniture', status: 'active', created_at: new Date().toISOString() },
  { id: 'c4', name: 'Vehicles', status: 'active', created_at: new Date().toISOString() },
  { id: 'c5', name: 'Meeting Rooms', status: 'active', created_at: new Date().toISOString() }
];

const SEED_PROFILES: Profile[] = [
  { id: 'p1', name: 'Priya Shah', email: 'priya@company.com', role: 'department_head', department_id: 'd1', status: 'active', created_at: new Date().toISOString() },
  { id: 'p2', name: 'Rahul Sharma', email: 'rahul@company.com', role: 'employee', department_id: 'd2', status: 'active', created_at: new Date().toISOString() },
  { id: 'p3', name: 'Fahad Hassan', email: 'fahad@company.com', role: 'admin', department_id: 'd3', status: 'active', created_at: new Date().toISOString() },
  { id: 'p4', name: 'Yash Raj', email: 'yash@company.com', role: 'asset_manager', department_id: 'd4', status: 'active', created_at: new Date().toISOString() }
];

const SEED_ASSETS: Asset[] = [
  { id: 'a1', tag: 'AF-0114', name: 'Dell XPS Laptop 15"', serial_number: 'DXPS-9812-H', category_id: 'c1', department_id: 'd1', status: 'allocated', is_bookable: false, condition: 'Excellent', created_at: new Date().toISOString() },
  { id: 'a2', tag: 'AF-0002', name: 'Dell 27" UltraSharp Monitor', serial_number: 'DELL-US27-K', category_id: 'c2', department_id: 'd1', status: 'available', is_bookable: false, condition: 'Excellent', created_at: new Date().toISOString() },
  { id: 'a3', tag: 'AF-9921', name: 'Ergonomic Office Chair', serial_number: 'HM-AERO-01', category_id: 'c3', department_id: 'd1', status: 'available', is_bookable: false, condition: 'Good', created_at: new Date().toISOString() },
  { id: 'a4', tag: 'AF-0004', name: 'Ford Transit Delivery Van', serial_number: 'FORD-TR-2024', category_id: 'c4', department_id: 'd4', status: 'available', is_bookable: true, condition: 'Good', created_at: new Date().toISOString() },
  { id: 'a5', tag: 'AF-0005', name: 'Main Conference Room B2', serial_number: 'ROOM-B2-HQ', category_id: 'c5', department_id: 'd2', status: 'available', is_bookable: true, condition: 'Excellent', created_at: new Date().toISOString() },
  { id: 'a6', tag: 'AF-0006', name: 'MacBook Pro 14" M3', serial_number: 'MBP-M3-8891', category_id: 'c1', department_id: 'd1', status: 'available', is_bookable: false, condition: 'Excellent', created_at: new Date().toISOString() }
];

const SEED_ALLOCATIONS: Allocation[] = [
  { id: 'al1', asset_id: 'a1', profile_id: 'p1', status: 'active', allocated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), expected_return_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }
];

const SEED_TRANSFERS: TransferRequest[] = [];
const SEED_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'ac1', actor_id: 'p4', action: 'asset_allocated', entity_type: 'asset', entity_id: 'a1', details: { asset_tag: 'AF-0114', assignee: 'Priya Shah' }, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];
const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', user_id: 'p1', type: 'transfer_request', message: 'Welcome to AssetFlow. Your role is Department Head.', is_read: false, created_at: new Date().toISOString() }
];

// Helper to safely load data from LocalStorage or initialize with Seed Data
function getStored<T>(key: string, seed: T[]): T[] {
  const data = localStorage.getItem(`assetflow_${key}`);
  if (!data) {
    localStorage.setItem(`assetflow_${key}`, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
}

function setStored<T>(key: string, data: T[]): void {
  localStorage.setItem(`assetflow_${key}`, JSON.stringify(data));
}

// Local Database State API Wrapper (Database Simulator for Demo)
export const localDb = {
  getDepartments: () => getStored<Department>('departments', SEED_DEPARTMENTS),
  getCategories: () => getStored<Category>('categories', SEED_CATEGORIES),
  getProfiles: () => getStored<Profile>('profiles', SEED_PROFILES),
  getAssets: () => getStored<Asset>('assets', SEED_ASSETS),
  getAllocations: () => getStored<Allocation>('allocations', SEED_ALLOCATIONS),
  getTransfers: () => getStored<TransferRequest>('transfers', SEED_TRANSFERS),
  getActivityLogs: () => getStored<ActivityLog>('activity_logs', SEED_ACTIVITY_LOGS),
  getNotifications: () => getStored<Notification>('notifications', SEED_NOTIFICATIONS),

  saveAssets: (assets: Asset[]) => setStored<Asset>('assets', assets),
  saveAllocations: (allocations: Allocation[]) => setStored<Allocation>('allocations', allocations),
  saveTransfers: (transfers: TransferRequest[]) => setStored<TransferRequest>('transfers', transfers),
  saveActivityLogs: (logs: ActivityLog[]) => setStored<ActivityLog>('activity_logs', logs),
  saveNotifications: (notes: Notification[]) => setStored<Notification>('notifications', notes),
  saveProfiles: (profiles: Profile[]) => setStored<Profile>('profiles', profiles),
};
