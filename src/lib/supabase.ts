import { createClient } from '@supabase/supabase-js';
import { 
  Asset, Profile, Department, Category, Allocation, 
  TransferRequest, Booking, MaintenanceRequest, 
  AuditCycle, AuditItem, Notification, ActivityLog,
  UserRole, AuditAuditor
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// SEED DATA FOR LOCAL STORAGE FALLBACK
// ==========================================
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', head_id: 'p3', parent_department_id: null, status: 'active' },
  { id: 'd2', name: 'Facilities', head_id: null, parent_department_id: null, status: 'active' },
  { id: 'd3', name: 'Field Ops (east)', head_id: null, parent_department_id: 'd2', status: 'inactive' }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Electronics', custom_fields: { warranty_period_months: 24 } },
  { id: 'c2', name: 'Furniture', custom_fields: {} },
  { id: 'c3', name: 'Vehicles', custom_fields: {} }
];

const DEFAULT_PROFILES: Profile[] = [
  { id: 'p1', name: 'Admin User', email: 'admin@assetflow.com', department_id: null, role: 'admin', status: 'active' },
  { id: 'p2', name: 'Arjun Nair', email: 'arjun@assetflow.com', department_id: 'd1', role: 'asset_manager', status: 'active' },
  { id: 'p3', name: 'Priya Shah', email: 'priya@assetflow.com', department_id: 'd1', role: 'department_head', status: 'active' },
  { id: 'p4', name: 'Rohan Gupta', email: 'rohan@assetflow.com', department_id: 'd2', role: 'employee', status: 'active' }
];

const DEFAULT_ASSETS: Asset[] = [
  { id: 'a1', tag: 'AF-0114', name: 'Dell laptop', category_id: 'c1', serial_number: 'SN-DLL-9921', acquisition_date: '2025-01-15', acquisition_cost: 1200, condition: 'good', location: 'Bengaluru', department_id: 'd1', photo_url: null, is_bookable: false, status: 'allocated' },
  { id: 'a2', tag: 'AF-0002', name: 'Projector', category_id: 'c1', serial_number: 'SN-PRJ-2281', acquisition_date: '2025-03-10', acquisition_cost: 800, condition: 'fair', location: 'HQ Floor 2', department_id: 'd2', photo_url: null, is_bookable: false, status: 'under_maintenance' },
  { id: 'a3', tag: 'AF-9921', name: 'Office chair', category_id: 'c2', serial_number: 'SN-CHR-0041', acquisition_date: '2024-11-20', acquisition_cost: 250, condition: 'good', location: 'Warehouse', department_id: 'd1', photo_url: null, is_bookable: false, status: 'available' },
  { id: 'a4', tag: 'AF-0004', name: 'Conference Room B2', category_id: 'c2', serial_number: null, acquisition_date: null, acquisition_cost: null, condition: 'excellent', location: 'HQ Floor 1', department_id: null, photo_url: null, is_bookable: true, status: 'available' },
  { id: 'a5', tag: 'AF-0005', name: 'Toyota Hilux', category_id: 'c3', serial_number: 'SN-VEH-1234', acquisition_date: '2024-05-18', acquisition_cost: 32000, condition: 'good', location: 'Field Ops East', department_id: 'd2', photo_url: null, is_bookable: true, status: 'available' }
];

const DEFAULT_ALLOCATIONS: Allocation[] = [
  { id: 'al1', asset_id: 'a1', employee_id: 'p3', department_id: 'd1', allocated_by: 'p2', allocated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), expected_return_date: '2026-07-20', returned_at: null, return_condition_notes: null, status: 'active' }
];

const DEFAULT_BOOKINGS: Booking[] = [
  { id: 'b1', resource_asset_id: 'a4', booked_by: 'p3', purpose: 'Q3 Team Sync', start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), end_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), status: 'ongoing' }
];

const DEFAULT_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  { id: 'm1', asset_id: 'a2', raised_by: 'p4', issue_description: 'Color output is distorted, lamp needs replacement.', priority: 'medium', photo_url: null, status: 'pending', technician_name: null, approved_by: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), resolved_at: null }
];

const DEFAULT_AUDIT_CYCLES: AuditCycle[] = [
  { id: 'ac1', name: 'Q3 Engineering Audit', department_id: 'd1', location: 'Bengaluru', date_range_start: '2026-07-01', date_range_end: '2026-07-31', status: 'open', created_by: 'p1', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];

const DEFAULT_AUDIT_ITEMS: AuditItem[] = [
  { id: 'ai1', audit_cycle_id: 'ac1', asset_id: 'a3', expected_location: 'Warehouse', verification_status: 'pending', notes: null },
  { id: 'ai2', audit_cycle_id: 'ac1', asset_id: 'a1', expected_location: 'Bengaluru Office', verification_status: 'pending', notes: null }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'n1', user_id: 'p3', type: 'asset_assigned', message: 'Laptop AF-0114 assigned to Priya Shah', related_entity_type: 'asset', related_entity_id: 'a1', is_read: false, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'l1', actor_id: 'p2', action: 'asset_allocated', entity_type: 'asset', entity_id: 'a1', details: { asset_tag: 'AF-0114', assignee: 'Priya Shah' }, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
];

// Helper to initialize local storage
function initLocalStorage() {
  const getOrSet = (key: string, val: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };
  getOrSet('af_departments', DEFAULT_DEPARTMENTS);
  getOrSet('af_categories', DEFAULT_CATEGORIES);
  getOrSet('af_profiles', DEFAULT_PROFILES);
  getOrSet('af_assets', DEFAULT_ASSETS);
  getOrSet('af_allocations', DEFAULT_ALLOCATIONS);
  getOrSet('af_bookings', DEFAULT_BOOKINGS);
  getOrSet('af_maintenance_requests', DEFAULT_MAINTENANCE_REQUESTS);
  getOrSet('af_audit_cycles', DEFAULT_AUDIT_CYCLES);
  const auditors = [{ audit_cycle_id: 'ac1', auditor_id: 'p3' }];
  getOrSet('af_audit_auditors', auditors);
  getOrSet('af_audit_items', DEFAULT_AUDIT_ITEMS);
  getOrSet('af_notifications', DEFAULT_NOTIFICATIONS);
  getOrSet('af_activity_logs', DEFAULT_ACTIVITY_LOGS);
}

if (typeof window !== 'undefined') {
  initLocalStorage();
}

// Read/Write helpers for state
export const stateDb = {
  get: <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]'),
  set: <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data)),
  
  getOne: <T extends { id: string }>(key: string, id: string): T | undefined => {
    return stateDb.get<T>(key).find(item => item.id === id);
  },
  
  updateOne: <T extends { id: string }>(key: string, id: string, updates: Partial<T>): T => {
    const list = stateDb.get<T>(key);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found in ${key}`);
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    stateDb.set(key, list);
    return updated;
  },
  
  insertOne: <T extends { id?: string }>(key: string, item: T): T => {
    const list = stateDb.get<T>(key);
    const newItem = { id: Math.random().toString(36).substr(2, 9), ...item } as T;
    list.push(newItem);
    stateDb.set(key, list);
    return newItem;
  }
};

// ==========================================
// UNIFIED DATA ACCESS LAYER (db)
// ==========================================
export const db = {
  // Profiles & Role Promotion
  getProfiles: async (): Promise<Profile[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Profile>('af_profiles');
  },
  
  updateProfileRole: async (profileId: string, role: UserRole, actorId: string): Promise<Profile> => {
    const updatedRole = role;
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: updatedRole })
        .eq('id', profileId)
        .select()
        .single();
      if (!error && data) {
        await db.logActivity({
          actorId,
          action: 'profile_role_updated',
          entityType: 'profile',
          entityId: profileId,
          details: { new_role: updatedRole }
        });
        return data;
      }
    }
    const profile = stateDb.updateOne<Profile>('af_profiles', profileId, { role: updatedRole });
    await db.logActivity({
      actorId,
      action: 'profile_role_updated',
      entityType: 'profile',
      entityId: profileId,
      details: { new_role: updatedRole, profile_name: profile.name }
    });
    return profile;
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('departments').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Department>('af_departments');
  },

  createDepartment: async (name: string, parentId: string | null = null, headId: string | null = null): Promise<Department> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('departments')
        .insert({ name, parent_department_id: parentId, head_id: headId, status: 'active' })
        .select()
        .single();
      if (!error && data) return data;
    }
    return stateDb.insertOne<Department>('af_departments', {
      id: '', name, parent_department_id: parentId, head_id: headId, status: 'active'
    });
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Category>('af_categories');
  },

  createCategory: async (name: string, customFields: Record<string, any> = {}): Promise<Category> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, custom_fields: customFields })
        .select()
        .single();
      if (!error && data) return data;
    }
    return stateDb.insertOne<Category>('af_categories', {
      id: '', name, custom_fields: customFields
    });
  },

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Asset>('af_assets');
  },

  createAsset: async (asset: Omit<Asset, 'id' | 'tag' | 'created_at'>): Promise<Asset> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single();
      if (!error && data) return data;
    }
    const assets = stateDb.get<Asset>('af_assets');
    const newTag = `AF-${String(assets.length + 1).padStart(4, '0')}`;
    return stateDb.insertOne<Asset>('af_assets', {
      ...asset,
      tag: newTag,
      id: ''
    });
  },

  updateAssetStatus: async (assetId: string, status: Asset['status']): Promise<Asset> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('assets')
        .update({ status })
        .eq('id', assetId)
        .select()
        .single();
      if (!error && data) return data;
    }
    return stateDb.updateOne<Asset>('af_assets', assetId, { status });
  },

  // Allocations & Transfers
  getAllocations: async (): Promise<Allocation[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('allocations').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Allocation>('af_allocations');
  },

  createAllocation: async (alloc: Omit<Allocation, 'id' | 'created_at'>, actorId: string): Promise<Allocation | null> => {
    if (supabase) {
      // Check existing active allocation
      const { data: existing } = await supabase
        .from('allocations')
        .select('*, profiles(name)')
        .eq('asset_id', alloc.asset_id)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('allocations')
        .insert(alloc)
        .select()
        .single();
      if (!error && data) {
        await supabase.from('assets').update({ status: 'allocated' }).eq('id', alloc.asset_id);
        const asset = await supabase.from('assets').select('name, tag').eq('id', alloc.asset_id).single();
        const profile = await supabase.from('profiles').select('name').eq('id', alloc.employee_id).single();
        
        await db.logActivity({
          actorId,
          action: 'asset_allocated',
          entityType: 'asset',
          entityId: alloc.asset_id,
          details: { asset_tag: asset.data?.tag, assignee: profile.data?.name },
          notifyUserId: alloc.employee_id || undefined,
          notifyMessage: `Asset ${asset.data?.name} (${asset.data?.tag}) has been assigned to you.`,
          notifyType: 'asset_assigned'
        });
        return data;
      }
    }
    
    // Check local active allocation
    const existing = stateDb.get<Allocation>('af_allocations')
      .find(a => a.asset_id === alloc.asset_id && a.status === 'active');
    if (existing) {
      return null;
    }

    const newAlloc = stateDb.insertOne<Allocation>('af_allocations', {
      ...alloc,
      id: '',
      allocated_at: new Date().toISOString()
    });

    const asset = stateDb.updateOne<Asset>('af_assets', alloc.asset_id, { status: 'allocated' });
    const profile = stateDb.get<Profile>('af_profiles').find(p => p.id === alloc.employee_id);

    await db.logActivity({
      actorId,
      action: 'asset_allocated',
      entityType: 'asset',
      entityId: alloc.asset_id,
      details: { asset_tag: asset.tag, assignee: profile?.name || 'Unknown' },
      notifyUserId: alloc.employee_id || undefined,
      notifyMessage: `Asset ${asset.name} (${asset.tag}) has been assigned to you.`,
      notifyType: 'asset_assigned'
    });

    return newAlloc;
  },

  createTransferRequest: async (tr: Omit<TransferRequest, 'id' | 'created_at' | 'status'>, actorId: string): Promise<TransferRequest> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('transfer_requests')
        .insert({ ...tr, status: 'pending' })
        .select()
        .single();
      if (!error && data) {
        const asset = await supabase.from('assets').select('name, tag').eq('id', tr.asset_id).single();
        const profiles = await supabase.from('profiles').select('*').eq('role', 'asset_manager');
        
        // Notify managers
        for (const manager of (profiles.data || [])) {
          await db.logActivity({
            actorId,
            action: 'transfer_requested',
            entityType: 'transfer_request',
            entityId: data.id,
            details: { asset_tag: asset.data?.tag },
            notifyUserId: manager.id,
            notifyMessage: `New transfer request for asset ${asset.data?.tag} raised.`,
            notifyType: 'transfer_requested'
          });
        }
        return data;
      }
    }
    
    const newTr = stateDb.insertOne<TransferRequest>('af_transfer_requests', {
      ...tr,
      status: 'pending',
      id: '',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('af_assets').find(a => a.id === tr.asset_id);
    const managers = stateDb.get<Profile>('af_profiles').filter(p => p.role === 'asset_manager');

    for (const manager of managers) {
      await db.logActivity({
        actorId,
        action: 'transfer_requested',
        entityType: 'transfer_request',
        entityId: newTr.id,
        details: { asset_tag: asset?.tag },
        notifyUserId: manager.id,
        notifyMessage: `New transfer request for asset ${asset?.tag} raised.`,
        notifyType: 'transfer_requested'
      });
    }

    return newTr;
  },

  // Resource Booking (P3)
  getBookings: async (): Promise<Booking[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('bookings').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<Booking>('af_bookings');
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'created_at' | 'status'>, actorId: string): Promise<Booking | null> => {
    const start = new Date(booking.start_time).toISOString();
    const end = new Date(booking.end_time).toISOString();
    
    if (supabase) {
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('resource_asset_id', booking.resource_asset_id)
        .neq('status', 'cancelled')
        .lt('start_time', end)
        .gt('end_time', start);

      if (conflicts && conflicts.length > 0) {
        return null;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...booking, start_time: start, end_time: end, status: 'upcoming' })
        .select()
        .single();

      if (!error && data) {
        const asset = await supabase.from('assets').select('name, tag').eq('id', booking.resource_asset_id).single();
        await db.logActivity({
          actorId,
          action: 'booking_confirmed',
          entityType: 'booking',
          entityId: data.id,
          details: { asset_tag: asset.data?.tag, start_time: start, end_time: end },
          notifyUserId: booking.booked_by || undefined,
          notifyMessage: `Booking confirmed for ${asset.data?.name} on ${new Date(start).toLocaleString()}`,
          notifyType: 'booking_confirmed'
        });
        return data;
      }
    }

    const conflicts = stateDb.get<Booking>('af_bookings').filter(b => 
      b.resource_asset_id === booking.resource_asset_id &&
      b.status !== 'cancelled' &&
      b.start_time < end &&
      b.end_time > start
    );

    if (conflicts.length > 0) {
      return null;
    }

    const newBooking = stateDb.insertOne<Booking>('af_bookings', {
      ...booking,
      id: '',
      status: 'upcoming',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('af_assets').find(a => a.id === booking.resource_asset_id);

    await db.logActivity({
      actorId,
      action: 'booking_confirmed',
      entityType: 'booking',
      entityId: newBooking.id,
      details: { asset_tag: asset?.tag, start_time: start, end_time: end },
      notifyUserId: booking.booked_by || undefined,
      notifyMessage: `Booking confirmed for ${asset?.name} on ${new Date(start).toLocaleString()}`,
      notifyType: 'booking_confirmed'
    });

    return newBooking;
  },

  // Maintenance (P3)
  getMaintenanceRequests: async (): Promise<MaintenanceRequest[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('maintenance_requests').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<MaintenanceRequest>('af_maintenance_requests');
  },

  createMaintenanceRequest: async (req: Omit<MaintenanceRequest, 'id' | 'created_at' | 'status' | 'technician_name' | 'approved_by' | 'resolved_at'>, actorId: string): Promise<MaintenanceRequest> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({ ...req, status: 'pending' })
        .select()
        .single();
      if (!error && data) {
        const asset = await supabase.from('assets').select('name, tag').eq('id', req.asset_id).single();
        const managers = await supabase.from('profiles').select('id').eq('role', 'asset_manager');
        for (const m of (managers.data || [])) {
          await db.logActivity({
            actorId,
            action: 'maintenance_requested',
            entityType: 'maintenance_request',
            entityId: data.id,
            details: { asset_tag: asset.data?.tag, issue: req.issue_description },
            notifyUserId: m.id,
            notifyMessage: `Maintenance requested for asset ${asset.data?.tag}`,
            notifyType: 'maintenance_requested'
          });
        }
        return data;
      }
    }
    
    const newReq = stateDb.insertOne<MaintenanceRequest>('af_maintenance_requests', {
      ...req,
      status: 'pending',
      technician_name: null,
      approved_by: null,
      resolved_at: null,
      id: '',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('af_assets').find(a => a.id === req.asset_id);
    const managers = stateDb.get<Profile>('af_profiles').filter(p => p.role === 'asset_manager');

    for (const m of managers) {
      await db.logActivity({
        actorId,
        action: 'maintenance_requested',
        entityType: 'maintenance_request',
        entityId: newReq.id,
        details: { asset_tag: asset?.tag, issue: req.issue_description },
        notifyUserId: m.id,
        notifyMessage: `Maintenance requested for asset ${asset?.tag}`,
        notifyType: 'maintenance_requested'
      });
    }

    return newReq;
  },

  updateMaintenanceRequest: async (
    reqId: string, 
    status: MaintenanceRequest['status'], 
    actorId: string, 
    fields?: Partial<MaintenanceRequest>
  ): Promise<MaintenanceRequest> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({ status, ...fields })
        .eq('id', reqId)
        .select()
        .single();
      if (!error && data) {
        const asset = await supabase.from('assets').select('name, tag').eq('id', data.asset_id).single();
        
        // Status flips asset status
        if (status === 'approved') {
          await supabase.from('assets').update({ status: 'under_maintenance' }).eq('id', data.asset_id);
        } else if (status === 'resolved') {
          await supabase.from('assets').update({ status: 'available' }).eq('id', data.asset_id);
        }

        await db.logActivity({
          actorId,
          action: `maintenance_${status}`,
          entityType: 'maintenance_request',
          entityId: reqId,
          details: { asset_tag: asset.data?.tag },
          notifyUserId: data.raised_by || undefined,
          notifyMessage: `Maintenance request for asset ${asset.data?.tag} updated to: ${status}`,
          notifyType: `maintenance_${status}`
        });

        return data;
      }
    }

    const updates: Partial<MaintenanceRequest> = { status, ...fields };
    if (status === 'approved') {
      updates.approved_by = actorId;
    }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    
    const req = stateDb.updateOne<MaintenanceRequest>('af_maintenance_requests', reqId, updates);
    const asset = stateDb.get<Asset>('af_assets').find(a => a.id === req.asset_id);

    if (status === 'approved') {
      stateDb.updateOne<Asset>('af_assets', req.asset_id, { status: 'under_maintenance' });
    } else if (status === 'resolved') {
      stateDb.updateOne<Asset>('af_assets', req.asset_id, { status: 'available' });
    }

    await db.logActivity({
      actorId,
      action: `maintenance_${status}`,
      entityType: 'maintenance_request',
      entityId: reqId,
      details: { asset_tag: asset?.tag },
      notifyUserId: req.raised_by || undefined,
      notifyMessage: `Maintenance request for asset ${asset?.tag} updated to: ${status}`,
      notifyType: `maintenance_${status}`
    });

    return req;
  },

  // ==========================================
  // P4 — GOVERNANCE & AUDITS
  // ==========================================
  getAuditCycles: async (): Promise<AuditCycle[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('audit_cycles').select('*');
      if (!error && data) return data;
    }
    return stateDb.get<AuditCycle>('af_audit_cycles');
  },

  createAuditCycle: async (
    cycle: Omit<AuditCycle, 'id' | 'status' | 'created_at'>, 
    auditorIds: string[], 
    assetIds: string[], 
    actorId: string
  ): Promise<AuditCycle> => {
    if (supabase) {
      const { data: newCycle, error: cErr } = await supabase
        .from('audit_cycles')
        .insert({ ...cycle, status: 'open' })
        .select()
        .single();
      
      if (!cErr && newCycle) {
        // Insert auditors
        const auditorsData = auditorIds.map(auditor_id => ({
          audit_cycle_id: newCycle.id,
          auditor_id
        }));
        await supabase.from('audit_auditors').insert(auditorsData);
        
        // Insert audit items
        const auditItemsData = assetIds.map(asset_id => ({
          audit_cycle_id: newCycle.id,
          asset_id,
          verification_status: 'pending'
        }));
        await supabase.from('audit_items').insert(auditItemsData);

        await db.logActivity({
          actorId,
          action: 'audit_cycle_created',
          entityType: 'audit_cycle',
          entityId: newCycle.id,
          details: { name: cycle.name }
        });

        // Notify auditors
        for (const auditorId of auditorIds) {
          await db.logActivity({
            actorId,
            action: 'audit_assigned',
            entityType: 'audit_cycle',
            entityId: newCycle.id,
            details: { name: cycle.name },
            notifyUserId: auditorId,
            notifyMessage: `You have been assigned as auditor for cycle "${cycle.name}"`,
            notifyType: 'audit_assigned'
          });
        }

        return newCycle;
      }
    }

    const newCycle = stateDb.insertOne<AuditCycle>('af_audit_cycles', {
      ...cycle,
      status: 'open',
      id: '',
      created_at: new Date().toISOString()
    });

    // Save auditors
    const auditorsList = stateDb.get<AuditAuditor>('af_audit_auditors');
    auditorIds.forEach(auditor_id => {
      auditorsList.push({ audit_cycle_id: newCycle.id, auditor_id });
    });
    stateDb.set('af_audit_auditors', auditorsList);

    // Save audit items
    const itemsList = stateDb.get<AuditItem>('af_audit_items');
    assetIds.forEach(asset_id => {
      itemsList.push({
        id: Math.random().toString(36).substr(2, 9),
        audit_cycle_id: newCycle.id,
        asset_id,
        expected_location: 'Default Location',
        verification_status: 'pending',
        notes: null
      });
    });
    stateDb.set('af_audit_items', itemsList);

    await db.logActivity({
      actorId,
      action: 'audit_cycle_created',
      entityType: 'audit_cycle',
      entityId: newCycle.id,
      details: { name: cycle.name }
    });

    for (const auditorId of auditorIds) {
      await db.logActivity({
        actorId,
        action: 'audit_assigned',
        entityType: 'audit_cycle',
        entityId: newCycle.id,
        details: { name: cycle.name },
        notifyUserId: auditorId,
        notifyMessage: `You have been assigned as auditor for cycle "${cycle.name}"`,
        notifyType: 'audit_assigned'
      });
    }

    return newCycle;
  },

  getAuditItems: async (cycleId: string): Promise<AuditItem[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_items')
        .select('*')
        .eq('audit_cycle_id', cycleId);
      if (!error && data) return data;
    }
    return stateDb.get<AuditItem>('af_audit_items').filter(item => item.audit_cycle_id === cycleId);
  },

  getAuditAuditors: async (cycleId: string): Promise<string[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_auditors')
        .select('auditor_id')
        .eq('audit_cycle_id', cycleId);
      if (!error && data) return data.map((d: { auditor_id: string }) => d.auditor_id);
    }
    return stateDb.get<AuditAuditor>('af_audit_auditors')
      .filter(a => a.audit_cycle_id === cycleId)
      .map(a => a.auditor_id);
  },

  updateAuditItemStatus: async (
    itemId: string, 
    status: AuditItem['verification_status'], 
    notes: string | null, 
    actorId: string
  ): Promise<AuditItem> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_items')
        .update({ verification_status: status, notes })
        .eq('id', itemId)
        .select()
        .single();
      
      if (!error && data) {
        const asset = await supabase.from('assets').select('name, tag').eq('id', data.asset_id).single();
        await db.logActivity({
          actorId,
          action: 'audit_item_verified',
          entityType: 'audit_item',
          entityId: itemId,
          details: { asset_tag: asset.data?.tag, status, notes }
        });
        return data;
      }
    }

    const updated = stateDb.updateOne<AuditItem>('af_audit_items', itemId, {
      verification_status: status,
      notes
    });

    const asset = stateDb.get<Asset>('af_assets').find(a => a.id === updated.asset_id);
    await db.logActivity({
      actorId,
      action: 'audit_item_verified',
      entityType: 'audit_item',
      entityId: itemId,
      details: { asset_tag: asset?.tag, status, notes }
    });

    return updated;
  },

  closeAuditCycle: async (cycleId: string, actorId: string): Promise<AuditCycle> => {
    if (supabase) {
      // Get all audit items that are missing
      const { data: missingItems } = await supabase
        .from('audit_items')
        .select('asset_id')
        .eq('audit_cycle_id', cycleId)
        .eq('verification_status', 'missing');
      
      const missingAssetIds = (missingItems || []).map((i: { asset_id: string }) => i.asset_id);
      
      // Update missing assets to 'lost'
      if (missingAssetIds.length > 0) {
        await supabase
          .from('assets')
          .update({ status: 'lost' })
          .in('id', missingAssetIds);
      }

      // Close cycle
      const { data: cycle, error } = await supabase
        .from('audit_cycles')
        .update({ status: 'closed' })
        .eq('id', cycleId)
        .select()
        .single();

      if (!error && cycle) {
        await db.logActivity({
          actorId,
          action: 'audit_cycle_closed',
          entityType: 'audit_cycle',
          entityId: cycleId,
          details: { closed_by: actorId, missing_assets_count: missingAssetIds.length }
        });
        
        // Notify asset managers about discrepancies
        if (missingAssetIds.length > 0) {
          const managers = await supabase.from('profiles').select('id').eq('role', 'asset_manager');
          for (const manager of (managers.data || [])) {
            await db.logActivity({
              actorId,
              action: 'audit_discrepancy',
              entityType: 'audit_cycle',
              entityId: cycleId,
              notifyUserId: manager.id,
              notifyMessage: `Audit cycle "${cycle.name}" closed with ${missingAssetIds.length} missing assets.`,
              notifyType: 'audit_discrepancy'
            });
          }
        }

        return cycle;
      }
    }

    const missingItems = stateDb.get<AuditItem>('af_audit_items')
      .filter(item => item.audit_cycle_id === cycleId && item.verification_status === 'missing');
    
    // Update assets to lost
    missingItems.forEach(item => {
      stateDb.updateOne<Asset>('af_assets', item.asset_id, { status: 'lost' });
    });

    const cycle = stateDb.updateOne<AuditCycle>('af_audit_cycles', cycleId, { status: 'closed' });

    await db.logActivity({
      actorId,
      action: 'audit_cycle_closed',
      entityType: 'audit_cycle',
      entityId: cycleId,
      details: { closed_by: actorId, missing_assets_count: missingItems.length }
    });

    if (missingItems.length > 0) {
      const managers = stateDb.get<Profile>('af_profiles').filter(p => p.role === 'asset_manager');
      for (const manager of managers) {
        await db.logActivity({
          actorId,
          action: 'audit_discrepancy',
          entityType: 'audit_cycle',
          entityId: cycleId,
          notifyUserId: manager.id,
          notifyMessage: `Audit cycle "${cycle.name}" closed with ${missingItems.length} missing assets.`,
          notifyType: 'audit_discrepancy'
        });
      }
    }

    return cycle;
  },

  // ==========================================
  // SHARED LOGGING & NOTIFICATIONS SIGNATURE
  // ==========================================
  logActivity: async (params: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, any>;
    notifyUserId?: string;
    notifyMessage?: string;
    notifyType?: string;
  }): Promise<void> => {
    if (supabase) {
      await supabase.from('activity_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: params.details || {}
      });
      if (params.notifyUserId && params.notifyMessage) {
        await supabase.from('notifications').insert({
          user_id: params.notifyUserId,
          type: params.notifyType || 'system',
          message: params.notifyMessage,
          related_entity_type: params.entityType,
          related_entity_id: params.entityId,
          is_read: false
        });
      }
      return;
    }

    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details || null,
      created_at: new Date().toISOString()
    };
    stateDb.insertOne<ActivityLog>('af_activity_logs', log);

    if (params.notifyUserId && params.notifyMessage) {
      const notif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: params.notifyUserId,
        type: params.notifyType || 'system',
        message: params.notifyMessage,
        related_entity_type: params.entityType,
        related_entity_id: params.entityId,
        is_read: false,
        created_at: new Date().toISOString()
      };
      stateDb.insertOne<Notification>('af_notifications', notif);
    }
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return stateDb.get<ActivityLog>('af_activity_logs').sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return stateDb.get<Notification>('af_notifications')
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  markNotificationRead: async (notifId: string): Promise<Notification> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId)
        .select()
        .single();
      if (!error && data) return data;
    }
    return stateDb.updateOne<Notification>('af_notifications', notifId, { is_read: true });
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    if (supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
      return;
    }
    const notifs = stateDb.get<Notification>('af_notifications');
    notifs.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    stateDb.set('af_notifications', notifs);
  }
};
