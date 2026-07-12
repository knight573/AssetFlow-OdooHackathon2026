import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Notification } from '../../lib/types';
import { 
  Bell, CheckCircle2, AlertCircle, 
  Calendar, Wrench, ShieldAlert, Check
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await db.getNotifications(user.id);
      setNotifications(data.filter(n => n.type !== 'booking_reminder_1h'));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await db.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await db.markAllNotificationsRead(user.id);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'asset_assigned':
      case 'transfer_approved':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'booking_confirmed':
        return <Calendar className="h-5 w-5 text-blue-400" />;
      case 'maintenance_requested':
      case 'maintenance_approved':
        return <Wrench className="h-5 w-5 text-amber-400" />;
      case 'maintenance_resolved':
        return <CheckCircle2 className="h-5 w-5 text-teal-400" />;
      case 'overdue_return':
        return <AlertCircle className="h-5 w-5 text-red-400 animate-pulse" />;
      case 'audit_discrepancy':
        return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      case 'audit_assigned':
        return <Bell className="h-5 w-5 text-purple-400" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" /> Inbox Notifications
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Stay updated with allocations, bookings, transfers, repairs, and audit status.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition"
          >
            <Check className="h-3.5 w-3.5" /> Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500 italic text-xs">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-4 border rounded-xl flex items-start gap-3.5 transition ${
                notif.is_read 
                  ? 'bg-slate-900/20 border-slate-800/50 opacity-60' 
                  : 'bg-indigo-950/20 border-indigo-500/20 shadow-md shadow-indigo-500/5'
              }`}
            >
              <div className="mt-0.5 p-1.5 bg-slate-950/40 rounded-lg shrink-0">
                {getNotifIcon(notif.type)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="text-xs text-slate-200 font-medium">
                  {notif.message}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(notif.created_at || '').toLocaleString()}
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  title="Mark as read"
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition shrink-0 mt-1"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
