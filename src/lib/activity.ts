import { supabase, isSupabaseConfigured } from './supabase';
import { insertMockRow } from './mockDb';
import { ActivityLog, Notification } from './types';

export async function logActivity(params: {
  actorId: string;
  action: string;              // e.g. 'asset_allocated', 'maintenance_approved'
  entityType: string;          // e.g. 'asset', 'booking'
  entityId: string;
  details?: Record<string, unknown>;
  notifyUserId?: string;
  notifyMessage?: string;      // e.g. "Laptop AF-0014 assigned to Priya Shah"
  notifyType?: string;
}) {
  const timestamp = new Date().toISOString();
  
  // 1. Insert Activity Log
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

  // 2. Insert Notification (optional)
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
  }

  // --- Real Supabase Execution ---
  if (isSupabaseConfigured) {
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
      console.error("Failed to write to Supabase in logActivity:", err);
    }
  }

  // --- Mock DB Fallback ---
  insertMockRow<ActivityLog>('activity_logs', newLog);
  if (newNotification) {
    insertMockRow<Notification>('notifications', newNotification);
  }
}
