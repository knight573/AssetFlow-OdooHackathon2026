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
import { getMockData } from '../lib/mockDb';
import { Asset, Booking, MaintenanceRequest, Notification, ActivityLog } from '../lib/types';
import { ClipboardCheck, TrendingUp, History, Terminal, Landmark } from 'lucide-react';
import { 
  LayoutDashboard, Wrench, CalendarDays, ShieldCheck, 
  FolderLock, Bell, LogOut, ChevronRight, Sparkles, User, Settings,
  Boxes, Layers
} from 'lucide-react';

export const App: React.FC = () => {
  const { profile, role, switchProfile, allProfiles, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'allocations' | 'booking' | 'maintenance' | 'audits' | 'reports' | 'logs' | 'notifications' | 'org'>('booking');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Preselected parameters for linking tabs between Directory and Allocations (P2 feature integration)
  const [preselectAssetId, setPreselectAssetId] = useState<string | undefined>(undefined);
  const [preselectAction, setPreselectAction] = useState<'allocate' | 'return' | 'transfer' | undefined>(undefined);

  const handleNavigateToAllocations = (assetId?: string, actionType?: 'allocate' | 'return' | 'transfer') => {
    setPreselectAssetId(assetId);
    setPreselectAction(actionType);
    setActiveTab('allocations');
  };

  const clearPreselect = () => {
    setPreselectAssetId(undefined);
    setPreselectAction(undefined);
  };

  // Feed stats from Mock database
  const loadDashboardData = () => {
    const nList = getMockData<Notification>('notifications');
    const aList = getMockData<ActivityLog>('activity_logs');
    const assetList = getMockData<Asset>('assets');
    setNotifications(nList);
    setActivities(aList);
    setAssets(assetList);
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

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Command Dashboard
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'org' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <Landmark className="w-5 h-5" />
            Organization Setup
          </button>

          <button
            onClick={() => setActiveTab('directory')}
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
            onClick={() => setActiveTab('allocations')}
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
            onClick={() => setActiveTab('booking')}
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
            onClick={() => setActiveTab('maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'maintenance' 
                ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
            }`}
          >
            <Wrench className="w-5 h-5" />
            Repair Kanban Board
          </button>

          {/* Person 4 Features (Insights) */}
          <div className="pt-6 border-t border-slate-900 mt-4 space-y-1.5 animate-fade-in">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 block mb-2">
              Governance & Insights
            </span>
            
            <button
              onClick={() => setActiveTab('audits')}
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
              onClick={() => setActiveTab('reports')}
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
              onClick={() => setActiveTab('logs')}
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
          
          {/* User selector demo controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-950 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-[11px] font-bold text-indigo-300">DEMO PROFILE SWITCHER:</label>
              <select
                value={profile?.id || ''}
                onChange={(e) => switchProfile(e.target.value)}
                className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-slate-100">
                    {p.name} ({p.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action alerts panel (Bell / Notifications) */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
                  <h4 className="font-bold text-xs text-white">Notifications Log ({notifications.length})</h4>
                  <button 
                    onClick={() => {
                      localStorage.setItem('assetflow_notifications', JSON.stringify([]));
                      setNotifications([]);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-[11px] text-slate-600 text-center py-4">No recent notification alerts</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl text-xs">
                        <p className="text-slate-300 font-medium leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
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
          {activeTab === 'org' && <OrgSetup />}
          
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
                <h1 className="text-3xl font-extrabold text-white">Command Dashboard</h1>
                <p className="text-slate-400">Organization-wide resource deployment stats.</p>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-900">
                  <span className="text-xs font-bold text-slate-500 uppercase">Available Assets</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-white">
                      {assets.filter(a => a.status === 'available').length}
                    </span>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-900">
                  <span className="text-xs font-bold text-slate-500 uppercase">Allocated Assets</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-indigo-400">
                      {assets.filter(a => a.status === 'allocated').length}
                    </span>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-900">
                  <span className="text-xs font-bold text-slate-500 uppercase">Under Maintenance</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-amber-400">
                      {assets.filter(a => a.status === 'under_maintenance').length}
                    </span>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-900">
                  <span className="text-xs font-bold text-slate-500 uppercase">Booked Resources</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold text-emerald-400">
                      {getMockData<Booking>('bookings').filter(b => b.status === 'upcoming').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overdue Banner */}
              <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <div>
                  <p className="text-sm font-semibold text-rose-350">3 Assets are Overdue for return</p>
                  <p className="text-xs text-slate-400 mt-0.5">Please check expected return dates under the "Allocations & Transfers" tab to process outstanding returns.</p>
                </div>
              </div>

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
