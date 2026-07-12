import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { ResourceBooking } from '../features/operations/ResourceBooking';
import { MaintenanceManagement } from '../features/operations/MaintenanceManagement';
import AssetDirectory from '../features/assets/AssetDirectory';
import AllocationTransfer from '../features/assets/AllocationTransfer';
import { AssetAudit } from '../features/insights/AssetAudit';
import { Reports } from '../features/insights/Reports';
import { ActivityLogs } from '../features/insights/ActivityLogs';
import { Notifications } from '../features/insights/Notifications';
import { DemoSimulator } from '../components/DemoSimulator';
import { OrgSetup } from '../features/organization/OrgSetup';
import { Login } from '../features/organization/Login';
import { getMockData, setMockData } from '../lib/mockDb';
import { Asset, Booking, MaintenanceRequest, Notification, ActivityLog, Allocation, TransferRequest, Profile, Department } from '../lib/types';
import { ClipboardCheck, TrendingUp, History, Terminal, Landmark, ArrowLeft, ArrowRight } from 'lucide-react';
import { 
  LayoutDashboard, Wrench, CalendarDays, ShieldCheck, 
  FolderLock, Bell, LogOut, ChevronRight, Sparkles, User, Settings,
  Boxes, Layers, Sun, Moon
} from 'lucide-react';

export const App: React.FC = () => {
  const { profile, role, switchProfile, allProfiles, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'allocations' | 'booking' | 'maintenance' | 'audits' | 'reports' | 'logs' | 'notifications' | 'org'>('booking');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);

  // Navigation history states for Back/Forward buttons
  const [historyStack, setHistoryStack] = useState<string[]>(['booking']);
  const [historyPointer, setHistoryPointer] = useState<number>(0);

  const navigateToTab = (tab: any, skipHistory = false) => {
    setActiveTab(tab);
    if (!skipHistory) {
      const newStack = historyStack.slice(0, historyPointer + 1);
      newStack.push(tab);
      setHistoryStack(newStack);
      setHistoryPointer(newStack.length - 1);
    }
  };

  const handleGoBack = () => {
    if (historyPointer > 0) {
      const prevPointer = historyPointer - 1;
      setHistoryPointer(prevPointer);
      setActiveTab(historyStack[prevPointer] as any);
    }
  };

  const handleGoForward = () => {
    if (historyPointer < historyStack.length - 1) {
      const nextPointer = historyPointer + 1;
      setHistoryPointer(nextPointer);
      setActiveTab(historyStack[nextPointer] as any);
    }
  };

  // Preselected parameters for linking tabs between Directory and Allocations (P2 feature integration)
  const [preselectAssetId, setPreselectAssetId] = useState<string | undefined>(undefined);
  const [preselectAction, setPreselectAction] = useState<'allocate' | 'return' | 'transfer' | undefined>(undefined);

  const handleNavigateToAllocations = (assetId?: string, actionType?: 'allocate' | 'return' | 'transfer') => {
    setPreselectAssetId(assetId);
    setPreselectAction(actionType);
    navigateToTab('allocations');
  };

  const clearPreselect = () => {
    setPreselectAssetId(undefined);
    setPreselectAction(undefined);
  };

  const checkUpcomingBookingReminders = (bookingsList: Booking[], currentUserId: string, profilesList: Profile[], assetsList: Asset[]) => {
    const notificationsList = getMockData<Notification>('notifications');
    const now = new Date();
    let updated = false;

    bookingsList.forEach(b => {
      if (b.status !== 'upcoming' || b.booked_by !== currentUserId) return;

      const startTime = new Date(b.start_time);
      const diffMs = startTime.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);

      // If booking starts in next 60 minutes
      if (diffMins > 0 && diffMins <= 60) {
        const alreadyNotified = notificationsList.some(n => n.related_entity_id === b.id && n.type === 'booking_reminder_1h');

        if (!alreadyNotified) {
          const asset = assetsList.find(a => a.id === b.resource_asset_id);
          const resourceName = asset ? asset.name : 'Shared Resource';
          const userProfile = profilesList.find(p => p.id === currentUserId);
          const userEmail = userProfile ? userProfile.email : 'user@company.com';

          // 1. App Icon Reminder (upcoming tag)
          notificationsList.push({
            id: crypto.randomUUID(),
            user_id: currentUserId,
            type: 'booking_upcoming',
            message: `⏰ Reminder: Your booking for "${b.purpose}" (${resourceName}) starts in 1 hour at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`,
            related_entity_type: 'booking',
            related_entity_id: b.id,
            is_read: false,
            created_at: now.toISOString()
          });

          // 2. Simulated Email Reminder
          notificationsList.push({
            id: crypto.randomUUID(),
            user_id: currentUserId,
            type: 'mock_email',
            message: `✉️ [Email Sent to ${userEmail}] Meeting Reminder: "${b.purpose}" (${resourceName}) is scheduled at ${startTime.toLocaleString()}.`,
            related_entity_type: 'booking',
            related_entity_id: b.id,
            is_read: false,
            created_at: now.toISOString()
          });

          // 3. Prevent duplicate notifications
          notificationsList.push({
            id: crypto.randomUUID(),
            user_id: currentUserId,
            type: 'booking_reminder_1h',
            message: `System: Reminder flagged for booking ${b.id}`,
            related_entity_type: 'booking',
            related_entity_id: b.id,
            is_read: true,
            created_at: now.toISOString()
          });

          updated = true;
        }
      }
    });

    if (updated) {
      setMockData('notifications', notificationsList);
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'notifications' } }));
    }
  };

  const checkOverdueAllocations = (allocationList: Allocation[], assetList: Asset[], currentUserId: string) => {
    let notificationsAdded = false;
    const notificationsList = getMockData<Notification>('notifications');
    const now = new Date();

    allocationList.forEach(al => {
      const returnDate = al.expected_return_date || al.expected_return_at;
      if (al.status === 'active' && returnDate && new Date(returnDate) < now) {
        const assetObj = assetList.find(a => a.id === al.asset_id);
        const uniqueMsg = `Asset Return Overdue Alert: ${assetObj?.tag} (${assetObj?.name}) was expected by ${new Date(returnDate).toLocaleDateString()}.`;
        
        if (!notificationsList.some(n => n.message === uniqueMsg)) {
          notificationsList.push({
            id: 'note-od-' + Math.random().toString(36).substring(2, 9),
            user_id: al.profile_id || al.employee_id || currentUserId,
            message: uniqueMsg,
            is_read: false,
            type: 'overdue_return',
            created_at: now.toISOString()
          });

          al.status = 'overdue';
          notificationsAdded = true;

          const logMsg = `Asset Return Overdue Alert: ${assetObj?.tag} is overdue for return.`;
          const allLogs = getMockData<ActivityLog>('activity_logs');
          allLogs.push({
            id: 'log-od-' + Math.random().toString(36).substring(2, 9),
            actor_id: 'system',
            action: 'return_overdue',
            entity_type: 'allocation',
            entity_id: al.id,
            details: { asset_tag: assetObj?.tag, expected_date: returnDate, message: logMsg },
            created_at: now.toISOString()
          });
          setMockData('activity_logs', allLogs);
        }
      }
    });

    if (notificationsAdded) {
      setMockData('notifications', notificationsList);
      setMockData('allocations', allocationList);
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'notifications' } }));
    }
  };

  useEffect(() => {
    if (profile) {
      const interval = setInterval(() => {
        const bList = getMockData<Booking>('bookings');
        const pList = getMockData<Profile>('profiles');
        const aList = getMockData<Asset>('assets');
        const allocList = getMockData<Allocation>('allocations');
        checkUpcomingBookingReminders(bList, profile.id, pList, aList);
        checkOverdueAllocations(allocList, aList, profile.id);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  // Feed stats from Mock database
  const loadDashboardData = () => {
    const nList = getMockData<Notification>('notifications');
    const aList = getMockData<ActivityLog>('activity_logs');
    const assetList = getMockData<Asset>('assets');
    const allocationList = getMockData<Allocation>('allocations');
    const transferList = getMockData<TransferRequest>('transfer_requests') || [];
    setNotifications(nList);
    setActivities(aList);
    setAssets(assetList);
    setAllocations(allocationList);
    setTransfers(transferList);
  };

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
    const handleDbChange = () => {
      if (profile) loadDashboardData();
    };
    window.addEventListener('mock-db-change', handleDbChange);
    return () => window.removeEventListener('mock-db-change', handleDbChange);
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex h-screen w-screen items-center justify-center bg-[#050811] text-slate-400 font-sans">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-t-indigo-500 border-slate-900 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold">Configuring AssetFlow Session...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  const unreadNotificationsCount = notifications.filter(n => n.user_id === profile.id && !n.is_read).length;

  const overdueCount = allocations.filter(a => {
    if (a.returned_at) return false;
    const returnDate = new Date(a.expected_return_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    returnDate.setHours(0,0,0,0);
    return returnDate < today;
  }).length;

  const upcomingCount = allocations.filter(a => {
    if (a.returned_at) return false;
    const returnDate = new Date(a.expected_return_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    returnDate.setHours(0,0,0,0);
    return returnDate >= today;
  }).length;

  const toggleNotifications = () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    if (nextShow && profile) {
      const allNotif = getMockData<Notification>('notifications');
      let updated = false;
      const updatedList = allNotif.map(n => {
        if (n.user_id === profile.id && !n.is_read) {
          updated = true;
          return { ...n, is_read: true };
        }
        return n;
      });
      if (updated) {
        setMockData('notifications', updatedList);
        setNotifications(updatedList);
      }
    }
  };

  return (
    <div className="min-h-screen flex text-slate-100 bg-[#050811]">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/40 backdrop-blur-md hidden md:flex flex-col">
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            AF
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wider text-white">AssetFlow</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Enterprise Resource</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => navigateToTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Command Dashboard
          </button>

          {role === 'admin' && (
            <button
              onClick={() => navigateToTab('org')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'org' 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Landmark className="w-5 h-5" />
              Organization Setup
            </button>
          )}

          <button
            onClick={() => navigateToTab('directory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'directory' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <Boxes className="w-5 h-5" />
            Asset Directory
          </button>

          <button
            onClick={() => navigateToTab('allocations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'allocations' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <Layers className="w-5 h-5" />
            Allocations & Transfers
          </button>
          
          <button
            onClick={() => navigateToTab('booking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'booking' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Resource Booking
          </button>

          <button
            onClick={() => navigateToTab('maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'maintenance' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <Wrench className="w-5 h-5" />
            Maintenance Management
          </button>

          {/* Person 4 Features (Insights) */}
          <div className="pt-6 border-t border-slate-900 mt-4 space-y-1.5 animate-fade-in">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 block mb-2">
              Governance & Insights
            </span>
            
            <button
              onClick={() => navigateToTab('audits')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'audits' 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <ClipboardCheck className="w-5 h-5" />
              Asset Audits
            </button>

            <button
              onClick={() => navigateToTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'reports' 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Reports & Analytics
            </button>

            <button
              onClick={() => navigateToTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <History className="w-5 h-5" />
              Activity Logs
            </button>
          </div>

          <div className="px-4 pt-4 pb-2">
            <button 
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 transition"
            >
              <Terminal className="h-4 w-4 text-indigo-400 animate-pulse" /> Action Simulator
            </button>
          </div>
        </nav>

        {/* Footer profile indicator */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <User className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{profile?.name || 'Employee'}</p>
              <p className="text-[9px] text-slate-400 capitalize mt-1">Role: {role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out session
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/20 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-4">
            {/* History Navigation Buttons */}
            <div className="flex items-center bg-slate-900/60 dark:bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={handleGoBack}
                disabled={historyPointer === 0}
                className="p-1 text-slate-400 hover:text-white dark:hover:text-white hover:bg-slate-800/40 dark:hover:bg-slate-900 rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1" />
              <button
                onClick={handleGoForward}
                disabled={historyPointer >= historyStack.length - 1}
                className="p-1 text-slate-400 hover:text-white dark:hover:text-white hover:bg-slate-800/40 dark:hover:bg-slate-900 rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                title="Go Forward"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* User selector demo controls */}
            {role === 'admin' ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-950 px-3 py-1.5 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <label className="text-[11px] font-bold text-indigo-300">Admin Access:</label>
                  <select
                    value={profile?.id || ''}
                    onChange={(e) => switchProfile(e.target.value)}
                    className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {allProfiles.filter(p => p.role !== 'admin' || p.id === profile?.id).map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-950 text-slate-100">
                        {p.name} ({p.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-450 font-bold tracking-wide">Enterprise Session Verified</span>
              </div>
            )}
          </div>

          {/* Action alerts panel (Bell / Notifications) */}
          <div className="flex items-center gap-4 relative">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
            </button>

            <button
              onClick={toggleNotifications}
              className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-[#0b0f19]" />
              )}
            </button>

            {/* Notifications overlay popover panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 glass-panel rounded-2xl border border-slate-800 shadow-2xl p-4 z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900 mb-3">
                  <h4 className="font-bold text-xs text-white">Notifications Log ({notifications.filter(n => n.user_id === profile.id && n.type !== 'booking_reminder_1h').length})</h4>
                  <button 
                    onClick={() => {
                      const allNotif = getMockData<Notification>('notifications');
                      const filtered = allNotif.filter(n => n.user_id !== profile.id);
                      setMockData('notifications', filtered);
                      setNotifications(filtered);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {notifications.filter(n => n.user_id === profile.id && n.type !== 'booking_reminder_1h').length === 0 ? (
                    <p className="text-[11px] text-slate-600 text-center py-4">No recent notification alerts</p>
                  ) : (
                    notifications.filter(n => n.user_id === profile.id && n.type !== 'booking_reminder_1h').map(n => {
                      const isUpcoming = n.type === 'booking_upcoming' || n.type === 'booking_confirmed';
                      const isEmail = n.type === 'mock_email';
                      
                      return (
                        <div key={n.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-xs space-y-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            {isUpcoming && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                Upcoming
                              </span>
                            )}
                            {isEmail && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                Email Sent
                              </span>
                            )}
                            {!isUpcoming && !isEmail && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-450 border border-slate-700/30">
                                Info
                              </span>
                            )}
                          </div>
                          <p className="text-slate-350 font-medium leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 3. Screen Mounting Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Tab Route Switching */}
          {activeTab === 'booking' && <ResourceBooking />}
          {activeTab === 'maintenance' && <MaintenanceManagement />}
          {activeTab === 'org' && role === 'admin' && <OrgSetup />}
          
          {/* Person 2 Features */}
          {activeTab === 'directory' && profile && (
            <AssetDirectory 
              currentUser={profile} 
              onNavigateToAllocations={handleNavigateToAllocations} 
            />
          )}
          
          {activeTab === 'allocations' && profile && (
            <AllocationTransfer
              currentUser={profile}
              preselectedAssetId={preselectAssetId}
              initialAction={preselectAction}
              clearPreselect={clearPreselect}
            />
          )}
          
          {/* Dashboard Tab mock preview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Command Dashboard</h1>
                <p className="text-sm text-slate-400 leading-relaxed">Organization-wide resource deployment and operational health.</p>
              </div>

              {/* Primary Metrics Grid (Strict 8px spacing, 12px card radius, refined typography) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {assets.filter(a => a.status === 'available').length}
                    </span>
                    <span className="text-xs text-slate-500">units</span>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocated</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-indigo-400 tracking-tight">
                      {assets.filter(a => a.status === 'allocated').length}
                    </span>
                    <span className="text-xs text-slate-500">deployed</span>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maintenance</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-amber-400 tracking-tight">
                      {assets.filter(a => a.status === 'under_maintenance').length}
                    </span>
                    <span className="text-xs text-slate-500">in repair</span>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bookings</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-cyan-400 tracking-tight">
                      {getMockData<Booking>('bookings').filter(b => b.status === 'upcoming').length}
                    </span>
                    <span className="text-xs text-slate-500">active</span>
                  </div>
                </div>
              </div>

              {/* Secondary Operations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Transfers</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-violet-400 tracking-tight">
                      {transfers.filter(t => t.status === 'pending').length}
                    </span>
                    <span className="text-xs text-slate-500">awaiting action</span>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-5 border border-rose-500/30 bg-rose-500/5 hover:border-rose-500/40 transition-colors flex flex-col justify-between min-h-[104px]">
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Overdue Returns</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-rose-500 tracking-tight">
                      {overdueCount}
                    </span>
                    <span className="text-xs text-rose-400/80">requires follow-up</span>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[104px]">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Returns</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-sky-400 tracking-tight">
                      {upcomingCount}
                    </span>
                    <span className="text-xs text-slate-500">scheduled</span>
                  </div>
                </div>
              </div>

              {/* All-in-One Operations Console (replaces Quick Actions) */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-900 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-indigo-400" />
                      All-in-One Operations Console
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live status feed of bookings, maintenance repairs, and allocations across all departments.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Column 1: Active Resource Bookings */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      📅 Active Bookings ({getMockData<Booking>('bookings').filter(b => b.status !== 'cancelled').length})
                    </span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {getMockData<Booking>('bookings').filter(b => b.status !== 'cancelled').length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2">No active bookings.</p>
                      ) : (
                        getMockData<Booking>('bookings')
                          .filter(b => b.status !== 'cancelled')
                          .map((b: any) => {
                            const res = getMockData<Asset>('assets').find(a => a.id === b.resource_asset_id);
                            const booker = getMockData<Profile>('profiles').find(p => p.id === b.booked_by);
                            return (
                              <div key={b.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-200 truncate">{b.purpose}</span>
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 font-extrabold">{b.status}</span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  {res?.name || 'Resource'} · By {booker?.name || 'Employee'}
                                </p>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Column 2: Active Maintenance Repairs */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      🔧 Active Repairs ({getMockData<MaintenanceRequest>('maintenance_requests').filter(r => r.status !== 'resolved' && r.status !== 'rejected').length})
                    </span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {getMockData<MaintenanceRequest>('maintenance_requests').filter(r => r.status !== 'resolved' && r.status !== 'rejected').length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2">No pending repairs.</p>
                      ) : (
                        getMockData<MaintenanceRequest>('maintenance_requests')
                          .filter(r => r.status !== 'resolved' && r.status !== 'rejected')
                          .map((r: any) => {
                            const asset = getMockData<Asset>('assets').find(a => a.id === r.asset_id);
                            const isHigh = r.priority === 'high';
                            return (
                              <div key={r.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-200 truncate">{asset?.name || 'Asset'}</span>
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isHigh ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                                  }`}>
                                    {r.priority.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{r.issue_description}</p>
                                <span className="text-[9px] font-semibold text-indigo-400">Status: {r.status.replace('_', ' ')}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Column 3: Active Allocations */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      📦 Active Allocations ({getMockData<Allocation>('allocations').filter(a => !a.returned_at).length})
                    </span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {getMockData<Allocation>('allocations').filter(a => !a.returned_at).length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2">No active allocations.</p>
                      ) : (
                        getMockData<Allocation>('allocations')
                          .filter(a => !a.returned_at)
                          .map((a: any) => {
                            const asset = getMockData<Asset>('assets').find(item => item.id === a.asset_id);
                            const emp = getMockData<Profile>('profiles').find(p => p.id === a.employee_id);
                            const dep = getMockData<Department>('departments').find(d => d.id === a.department_id);
                            const isOverdue = a.status === 'overdue';
                            return (
                              <div key={a.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-200 truncate">{asset?.name || 'Asset'}</span>
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isOverdue ? 'bg-rose-950 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {isOverdue ? 'OVERDUE' : 'ACTIVE'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-550">
                                  Assigned to: {emp?.name || dep?.name || 'Staff'}
                                </p>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Overdue Banner */}
              {overdueCount > 0 && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center gap-3 animate-pulse-slow">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  <div>
                    <p className="text-sm font-semibold text-rose-350">{overdueCount} {overdueCount === 1 ? 'Asset is' : 'Assets are'} Overdue for return</p>
                    <p className="text-xs text-slate-400 mt-0.5">Please check expected return dates under the "Allocations & Transfers" tab to process outstanding returns.</p>
                  </div>
                </div>
              )}

              {/* Activity Log Feed */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-900">
                <h3 className="font-bold text-sm text-slate-200 mb-4">Organization Recent Activity Log</h3>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No logs generated yet. Perform allocations, scheduling or maintenance to trigger activity logs.</p>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="p-3 bg-slate-950/20 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          <div>
                            <p className="text-slate-300 font-semibold">Action: <span className="text-indigo-400">{act.action}</span></p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Entity: {act.entity_type} ({act.entity_id?.slice(0, 8) || 'N/A'}...)</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(act.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Person 4 Features */}
          {activeTab === 'audits' && <AssetAudit />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'logs' && <ActivityLogs />}
          {activeTab === 'notifications' && <Notifications />}
        </main>
      </div>

      <DemoSimulator 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
        onTriggerRefresh={loadDashboardData}
      />

    </div>
  );
};
export default App;
