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

  // Audits logic
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
      // Get all audit items that are missing
      const { data: missingItems } = await supabase
        .from('audit_items')
        .select('asset_id')
        .eq('audit_cycle_id', cycleId)
        .eq('verification_status', 'missing');
      
      const missingAssetIds = (missingItems || []).map((i: any) => i.asset_id);
      
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

        return cycle as AuditCycle;
      }
    }

    const missingItems = stateDb.get<AuditItem>('audit_items')
      .filter(item => item.audit_cycle_id === cycleId && item.verification_status === 'missing');
    
    // Update assets to lost
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
