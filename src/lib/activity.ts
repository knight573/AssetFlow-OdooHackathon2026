import { supabase, isSupabaseConfigured } from './supabase';
import { insertMockRow } from './mockDb';
import { ActivityLog, Notification } from './types';

export async function logActivity(params: {
  actorId: string;
  action: string;              // e.g. 'asset_allocated', 'maintenance_approved', 'asset_registered', 'transfer_requested'
  entityType: string;          // e.g. 'asset', 'booking', 'transfer_request'
  entityId: string;
  details?: Record<string, any>;
  notifyUserId?: string;
  notifyMessage?: string;      // e.g. "Laptop AF-0114 assigned to Priya Shah"
  notifyType?: string;
}) {
  const timestamp = new Date().toISOString();
  
  // 1. Insert Activity Log locally
  const logId = crypto.randomUUID();
  const newLog: ActivityLog = {
    id: logId,
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: params.details || null,
    created_at: timestamp
  };
  insertMockRow<ActivityLog>('activity_logs', newLog);

  // 2. Insert Notification locally (optional)
  let newNotification: Notification | null = null;
  if (params.notifyUserId && params.notifyMessage) {
    newNotification = {
      id: crypto.randomUUID(),
      user_id: params.notifyUserId,
      type: params.notifyType || 'system',
      message: params.notifyMessage,
      related_entity_type: params.entityType,
      related_entity_id: params.entityId,
      is_read: false,
      created_at: timestamp
    };
    insertMockRow<Notification>('notifications', newNotification);
  }

  // --- Real Supabase Execution ---
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('activity_logs').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: params.details
      });

      if (newNotification) {
        await supabase.from('notifications').insert({
          user_id: newNotification.user_id,
          type: newNotification.type,
          message: newNotification.message,
          related_entity_type: newNotification.related_entity_type,
          related_entity_id: newNotification.related_entity_id
        });
      }
    } catch (err) {
      console.warn("Failed to write log to Supabase:", err);
    }
  }
}

export default logActivity;
