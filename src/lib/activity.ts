import { localDb, supabase, isSupabaseConfigured } from './supabase';
import type { ActivityLog, Notification } from './types';

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
  // 1. Log locally in localStorage
  const logs = localDb.getActivityLogs();
  const newLog: ActivityLog = {
    id: 'act-' + Math.random().toString(36).substring(2, 11),
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    details: params.details || {},
    created_at: new Date().toISOString()
  };
  localDb.saveActivityLogs([newLog, ...logs]);

  // Handle local notification if notifyUserId and notifyMessage are provided
  if (params.notifyUserId && params.notifyMessage) {
    const notifications = localDb.getNotifications();
    const newNotification: Notification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      user_id: params.notifyUserId,
      type: params.notifyType || 'system',
      message: params.notifyMessage,
      related_entity_type: params.entityType,
      related_entity_id: params.entityId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    localDb.saveNotifications([newNotification, ...notifications]);
  }

  // 2. Perform Supabase database inserts asynchronously if configured
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
          related_entity_id: params.entityId
        });
      }
    } catch (err) {
      console.warn("Failed to log activity to Supabase database", err);
    }
  }
}
export default logActivity;
