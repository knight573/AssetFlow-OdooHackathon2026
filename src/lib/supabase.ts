import { createClient } from '@supabase/supabase-js';
import { 
  Asset, 
  Allocation, 
  TransferRequest, 
  Profile, 
  Department, 
  Category, 
  ActivityLog, 
  Notification,
  AuditCycle,
  AuditAuditor,
  AuditItem,
  Booking,
  MaintenanceRequest,
  UserRole
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

// ==========================================
// PERSON 2 MOCK DB COMPATIBILITY LAYER
// ==========================================
export const localDb = {
  getDepartments: () => getStored<Department>('departments'),
  getCategories: () => getStored<Category>('categories'),
  getProfiles: () => getStored<Profile>('profiles'),
  getAssets: () => getStored<Asset>('assets'),
  getAllocations: () => getStored<Allocation>('allocations'),
  getTransfers: () => getStored<TransferRequest>('transfer_requests'),
  getActivityLogs: () => getStored<ActivityLog>('activity_logs'),
  getNotifications: () => getStored<Notification>('notifications'),

  saveAssets: (assets: Asset[]) => setStored<Asset>('assets', assets),
  saveAllocations: (allocations: Allocation[]) => setStored<Allocation>('allocations', allocations),
  saveTransfers: (transfers: TransferRequest[]) => setStored<TransferRequest>('transfer_requests', transfers),
  saveActivityLogs: (logs: ActivityLog[]) => setStored<ActivityLog>('activity_logs', logs),
  saveNotifications: (notes: Notification[]) => setStored<Notification>('notifications', notes),
  saveProfiles: (profiles: Profile[]) => setStored<Profile>('profiles', profiles),
};

// ==========================================
// PERSON 4 MOCK DB COMPATIBILITY LAYER
// ==========================================
export const stateDb = {
  get: <T>(key: string): T[] => {
    // Translate af_ key to assetflow_ key
    const rawKey = key.startsWith('af_') ? key.slice(3) : key;
    return getStored<T>(rawKey);
  },
  set: <T>(key: string, data: T[]) => {
    const rawKey = key.startsWith('af_') ? key.slice(3) : key;
    setStored(rawKey, data);
  },
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
    const newItem = { id: item.id || crypto.randomUUID(), ...item } as T;
    list.unshift(newItem);
    stateDb.set(key, list);
    return newItem;
  }
};

// ==========================================
// PERSON 4 UNIFIED DATABASE LAYER (db)
// ==========================================
export const db = {
  // Profiles
  getProfiles: async (): Promise<Profile[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as Profile[];
    }
    return stateDb.get<Profile>('profiles');
  },
  
  updateProfileRole: async (profileId: string, role: UserRole, actorId: string): Promise<Profile> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profileId)
        .select()
        .single();
      if (!error && data) {
        await db.logActivity({
          actorId,
          action: 'profile_role_updated',
          entityType: 'profile',
          entityId: profileId,
          details: { new_role: role }
        });
        return data as Profile;
      }
    }
    const profile = stateDb.updateOne<Profile>('profiles', profileId, { role });
    await db.logActivity({
      actorId,
      action: 'profile_role_updated',
      entityType: 'profile',
      entityId: profileId,
      details: { new_role: role, profile_name: profile.name }
    });
    return profile;
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('departments').select('*');
      if (!error && data) return data as Department[];
    }
    return stateDb.get<Department>('departments');
  },

  createDepartment: async (name: string, parentId: string | null = null, headId: string | null = null): Promise<Department> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('departments')
        .insert({ name, parent_department_id: parentId, head_id: headId, status: 'active' })
        .select()
        .single();
      if (!error && data) return data as Department;
    }
    return stateDb.insertOne<Department>('departments', {
      id: '', name, parent_department_id: parentId, head_id: headId, status: 'active', created_at: new Date().toISOString()
    });
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) return data as Category[];
    }
    return stateDb.get<Category>('categories');
  },

  createCategory: async (name: string, customFields: any = {}): Promise<Category> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, custom_fields: customFields })
        .select()
        .single();
      if (!error && data) return data as Category;
    }
    return stateDb.insertOne<Category>('categories', {
      id: '', name, custom_fields: customFields, created_at: new Date().toISOString()
    });
  },

  // Assets
  getAssets: async (): Promise<Asset[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data) return data as Asset[];
    }
    return stateDb.get<Asset>('assets');
  },

  createAsset: async (asset: Omit<Asset, 'id' | 'tag' | 'created_at'>): Promise<Asset> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single();
      if (!error && data) return data as Asset;
    }
    const assets = stateDb.get<Asset>('assets');
    const newTag = `AF-${String(assets.length + 1).padStart(4, '0')}`;
    return stateDb.insertOne<Asset>('assets', {
      ...asset,
      tag: newTag,
      id: '',
      created_at: new Date().toISOString()
    });
  },

  updateAssetStatus: async (assetId: string, status: Asset['status']): Promise<Asset> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .update({ status })
        .eq('id', assetId)
        .select()
        .single();
      if (!error && data) return data as Asset;
    }
    return stateDb.updateOne<Asset>('assets', assetId, { status });
  },

  // Allocations & Transfers
  getAllocations: async (): Promise<Allocation[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('allocations').select('*');
      if (!error && data) return data as Allocation[];
    }
    return stateDb.get<Allocation>('allocations');
  },

  createAllocation: async (alloc: Omit<Allocation, 'id' | 'created_at'>, actorId: string): Promise<Allocation | null> => {
    if (isSupabaseConfigured && supabase) {
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
        return data as Allocation;
      }
    }
    
    // Check local active allocation
    const existing = stateDb.get<Allocation>('allocations')
      .find(a => a.asset_id === alloc.asset_id && a.status === 'active');
    if (existing) {
      return null;
    }

    const newAlloc = stateDb.insertOne<Allocation>('allocations', {
      ...alloc,
      id: '',
      allocated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    const asset = stateDb.updateOne<Asset>('assets', alloc.asset_id, { status: 'allocated' });
    const profile = stateDb.get<Profile>('profiles').find(p => p.id === alloc.employee_id);

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
    if (isSupabaseConfigured && supabase) {
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
        return data as TransferRequest;
      }
    }
    
    const newTr = stateDb.insertOne<TransferRequest>('transfer_requests', {
      ...tr,
      status: 'pending',
      id: '',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('assets').find(a => a.id === tr.asset_id);
    const managers = stateDb.get<Profile>('profiles').filter(p => p.role === 'asset_manager');

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

  // Resource Booking
  getBookings: async (): Promise<Booking[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookings').select('*');
      if (!error && data) return data as Booking[];
    }
    return stateDb.get<Booking>('bookings');
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'created_at' | 'status'>, actorId: string): Promise<Booking | null> => {
    const start = new Date(booking.start_time).toISOString();
    const end = new Date(booking.end_time).toISOString();
    
    if (isSupabaseConfigured && supabase) {
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
        return data as Booking;
      }
    }

    const conflicts = stateDb.get<Booking>('bookings').filter(b => 
      b.resource_asset_id === booking.resource_asset_id &&
      b.status !== 'cancelled' &&
      b.start_time < end &&
      b.end_time > start
    );

    if (conflicts.length > 0) {
      return null;
    }

    const newBooking = stateDb.insertOne<Booking>('bookings', {
      ...booking,
      status: 'upcoming',
      id: '',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('assets').find(a => a.id === booking.resource_asset_id);
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

  // Maintenance
  getMaintenanceRequests: async (): Promise<MaintenanceRequest[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('maintenance_requests').select('*');
      if (!error && data) return data as MaintenanceRequest[];
    }
    return stateDb.get<MaintenanceRequest>('maintenance_requests');
  },

  createMaintenanceRequest: async (req: Omit<MaintenanceRequest, 'id' | 'created_at' | 'status' | 'technician_name' | 'approved_by' | 'resolved_at'>, actorId: string): Promise<MaintenanceRequest> => {
    if (isSupabaseConfigured && supabase) {
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
        return data as MaintenanceRequest;
      }
    }
    
    const newReq = stateDb.insertOne<MaintenanceRequest>('maintenance_requests', {
      ...req,
      status: 'pending',
      technician_name: null,
      approved_by: null,
      resolved_at: null,
      id: '',
      created_at: new Date().toISOString()
    });

    const asset = stateDb.get<Asset>('assets').find(a => a.id === req.asset_id);
    const managers = stateDb.get<Profile>('profiles').filter(p => p.role === 'asset_manager');

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
    if (isSupabaseConfigured && supabase) {
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

        return data as MaintenanceRequest;
      }
    }

    const updates: Partial<MaintenanceRequest> = { status, ...fields };
    if (status === 'approved') {
      updates.approved_by = actorId;
    }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    
    const req = stateDb.updateOne<MaintenanceRequest>('maintenance_requests', reqId, updates);
    const asset = stateDb.get<Asset>('assets').find(a => a.id === req.asset_id);

    if (status === 'approved') {
      stateDb.updateOne<Asset>('assets', req.asset_id, { status: 'under_maintenance' });
    } else if (status === 'resolved') {
      stateDb.updateOne<Asset>('assets', req.asset_id, { status: 'available' });
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

  // Governance & Audits
  getAuditCycles: async (): Promise<AuditCycle[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('audit_cycles').select('*');
      if (!error && data) return data as AuditCycle[];
    }
    return stateDb.get<AuditCycle>('audit_cycles');
  },

  getAuditItems: async (cycleId: string): Promise<AuditItem[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('audit_items')
        .select('*')
        .eq('audit_cycle_id', cycleId);
      if (!error && data) return data as AuditItem[];
    }
    return stateDb.get<AuditItem>('audit_items').filter(item => item.audit_cycle_id === cycleId);
  },

  createAuditCycle: async (
    cycle: Omit<AuditCycle, 'id' | 'status' | 'created_at'>, 
    auditorIds: string[], 
    assetIds: string[], 
    actorId: string
  ): Promise<AuditCycle> => {
    if (isSupabaseConfigured && supabase) {
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

        return newCycle as AuditCycle;
      }
    }

    const newCycle = stateDb.insertOne<AuditCycle>('audit_cycles', {
      ...cycle,
      status: 'open',
      id: '',
      created_at: new Date().toISOString()
    });

    // Save auditors
    const auditorsList = stateDb.get<AuditAuditor>('audit_auditors');
    auditorIds.forEach(auditor_id => {
      auditorsList.push({ audit_cycle_id: newCycle.id, auditor_id });
    });
    stateDb.set('audit_auditors', auditorsList);

    // Save audit items
    const itemsList = stateDb.get<AuditItem>('audit_items');
    assetIds.forEach(asset_id => {
      itemsList.push({
        id: crypto.randomUUID(),
        audit_cycle_id: newCycle.id,
        asset_id,
        expected_location: 'Default Location',
        verification_status: 'pending',
        notes: null,
        created_at: new Date().toISOString()
      });
    });
    stateDb.set('audit_items', itemsList);

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

  updateAuditItemStatus: async (
    itemId: string, 
    status: AuditItem['verification_status'], 
    notes: string | null, 
    actorId: string
  ): Promise<AuditItem> => {
    if (isSupabaseConfigured && supabase) {
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
        return data as AuditItem;
      }
    }

    const updated = stateDb.updateOne<AuditItem>('audit_items', itemId, {
      verification_status: status,
      notes
    });

    const asset = stateDb.get<Asset>('assets').find(a => a.id === updated.asset_id);
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
    if (isSupabaseConfigured && supabase) {
      const { data: missingItems } = await supabase
        .from('audit_items')
        .select('asset_id')
        .eq('audit_cycle_id', cycleId)
        .eq('verification_status', 'missing');
      
      const missingAssetIds = (missingItems || []).map((i: any) => i.asset_id);
      
      if (missingAssetIds.length > 0) {
        await supabase
          .from('assets')
          .update({ status: 'lost' })
          .in('id', missingAssetIds);
      }

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

        return cycle as AuditCycle;
      }
    }

    const missingItems = stateDb.get<AuditItem>('audit_items')
      .filter(item => item.audit_cycle_id === cycleId && item.verification_status === 'missing');
    
    missingItems.forEach(item => {
      if (item.asset_id) {
        stateDb.updateOne<Asset>('assets', item.asset_id, { status: 'lost' });
      }
    });

    const cycle = stateDb.updateOne<AuditCycle>('audit_cycles', cycleId, { status: 'closed' });

    await db.logActivity({
      actorId,
      action: 'audit_cycle_closed',
      entityType: 'audit_cycle',
      entityId: cycleId,
      details: { closed_by: actorId, missing_assets_count: missingItems.length }
    });

    if (missingItems.length > 0) {
      const managers = stateDb.get<Profile>('profiles').filter(p => p.role === 'asset_manager');
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

  // Shared logging & notifications
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
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
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
      } catch (err) {
        console.warn("Failed to write log to Supabase:", err);
      }
    }

    const log: ActivityLog = {
      id: crypto.randomUUID(),
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details || null,
      created_at: timestamp
    };
    stateDb.insertOne<ActivityLog>('activity_logs', log);

    if (params.notifyUserId && params.notifyMessage) {
      const notif: Notification = {
        id: crypto.randomUUID(),
        user_id: params.notifyUserId,
        type: params.notifyType || 'system',
        message: params.notifyMessage,
        related_entity_type: params.entityType,
        related_entity_id: params.entityId,
        is_read: false,
        created_at: timestamp
      };
      stateDb.insertOne<Notification>('notifications', notif);
    }
  },

  getActivityLogs: async (): Promise<ActivityLog[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as ActivityLog[];
    }
    return stateDb.get<ActivityLog>('activity_logs').sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as Notification[];
    }
    return stateDb.get<Notification>('notifications')
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  markNotificationRead: async (notifId: string): Promise<Notification> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId)
        .select()
        .single();
      if (!error && data) return data as Notification;
    }
    return stateDb.updateOne<Notification>('notifications', notifId, { is_read: true });
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
      return;
    }
    const notifs = stateDb.get<Notification>('notifications');
    notifs.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    stateDb.set('notifications', notifs);
  }
};
