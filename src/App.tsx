import { useState, useEffect } from 'react';
import Layout from './app/Layout';
import AssetDirectory from './features/assets/AssetDirectory';
import AllocationTransfer from './features/assets/AllocationTransfer';
import type { Profile } from './lib/types';
import { localDb } from './lib/supabase';
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Users, 
  ShieldCheck 
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('directory');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [kpiStats, setKpiStats] = useState({ total: 0, available: 0, allocated: 0, maintenance: 0 });

  // Preselected parameters for linking tabs
  const [preselectAssetId, setPreselectAssetId] = useState<string | undefined>(undefined);
  const [preselectAction, setPreselectAction] = useState<'allocate' | 'return' | 'transfer' | undefined>(undefined);

  // Initialize simulated user session
  useEffect(() => {
    const profiles = localDb.getProfiles();
    // Default to Yash Raj (Asset Manager) for testing
    const defaultUser = profiles.find(p => p.role === 'asset_manager') || profiles[0];
    setCurrentUser(defaultUser);
  }, []);

  // Update dashboard counters & activity logs when tab changes or data changes
  const updateDashboard = () => {
    const assets = localDb.getAssets();
    setKpiStats({
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      allocated: assets.filter(a => a.status === 'allocated').length,
      maintenance: assets.filter(a => a.status === 'under_maintenance').length,
    });
    setRecentActivities(localDb.getActivityLogs().slice(0, 5));
  };

  useEffect(() => {
    updateDashboard();
  }, [activeTab]);

  const handleNavigateToAllocations = (assetId?: string, actionType?: 'allocate' | 'return' | 'transfer') => {
    setPreselectAssetId(assetId);
    setPreselectAction(actionType);
    setActiveTab('allocations');
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400 font-sans">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-t-brand-500 border-slate-800 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold">Configuring AssetFlow Session...</p>
        </div>
      </div>
    );
  }

  // RENDER DYNAMIC COMPONENT PANEL
  const renderTabContent = () => {
    switch (activeTab) {
      case 'directory':
        return (
          <AssetDirectory 
            currentUser={currentUser} 
            onNavigateToAllocations={handleNavigateToAllocations} 
          />
        );
      case 'allocations':
        return (
          <AllocationTransfer
            currentUser={currentUser}
            preselectedAssetId={preselectAssetId}
            initialAction={preselectAction}
            clearPreselect={() => {
              setPreselectAssetId(undefined);
              setPreselectAction(undefined);
            }}
          />
        );

      // --- P1 MOCKED DASHBOARD ---
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">System Dashboard</h2>
              <p className="text-sm text-slate-400 mt-1">Cross-cutting aggregate metrics and live audit trails (P1 Owned).</p>
            </div>

            {/* KPI Panels */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Assets', value: kpiStats.total, change: '+12% this month' },
                { label: 'Available Nodes', value: kpiStats.available, change: 'Ready for allocation' },
                { label: 'Allocated Hardware', value: kpiStats.allocated, change: 'In active use' },
                { label: 'Active Repairs', value: kpiStats.maintenance, change: 'Technician assigned' },
              ].map((c, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/35 glass-card shadow">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                  <h4 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{c.value}</h4>
                  <span className="text-[10px] text-slate-500 mt-1 block font-medium">{c.change}</span>
                </div>
              ))}
            </div>

            {/* Banner Block */}
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-350">3 Assets are Overdue for return</p>
                <p className="text-xs text-slate-400 mt-0.5">Please check allocation dates under "Allocations & Transfers" tab to process outstanding returns.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Activity Feed */}
              <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-800/80 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-brand-400" />
                  Recent Activity Trail
                </h3>
                <div className="divide-y divide-slate-850">
                  {recentActivities.map((log) => (
                    <div key={log.id} className="py-3.5 flex items-start justify-between gap-3 text-xs first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-200">
                          {log.action.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <p className="text-slate-400">
                          Asset tag: <span className="text-brand-300 font-semibold">{log.details?.asset_tag || 'N/A'}</span>
                          {log.details?.assignee && ` assigned to ${log.details.assignee}`}
                          {log.details?.to && ` transferred to ${log.details.to}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Shortcut Links */}
              <div className="glass p-6 rounded-2xl border border-slate-800/80 space-y-4">
                <h3 className="font-bold text-white text-sm">Integration Shortcuts</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('directory')}
                    className="w-full text-left p-3 rounded-xl border border-slate-850 hover:bg-slate-900/60 hover:border-brand-500/20 text-xs font-semibold text-slate-355 transition-all flex items-center justify-between"
                  >
                    <span>View Asset Directory</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400">P2 Owned</span>
                  </button>
                  <button 
                    onClick={() => handleNavigateToAllocations()}
                    className="w-full text-left p-3 rounded-xl border border-slate-850 hover:bg-slate-900/60 hover:border-brand-500/20 text-xs font-semibold text-slate-355 transition-all flex items-center justify-between"
                  >
                    <span>Allocate Hardware Node</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400">P2 Owned</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      // --- MOCKED VIEWS FOR P3/P4 FOR INTEGRATION VISUALIZATION ---
      default:
        const tabConfig = {
          booking: { title: 'Resource Booking Portal', desc: 'Calendar scheduling and conflict-free booking for shared resource assets (P3 Owned).', icon: Calendar },
          maintenance: { title: 'Maintenance Management Kanban', desc: 'Raise repair tickets, assign technicians, and resolve hardware issues (P3 Owned).', icon: Wrench },
          audit: { title: 'Asset Governance & Audit cycles', desc: 'Perform periodic checks, register auditor profiles, and file discrepancy reports (P4 Owned).', icon: ClipboardCheck },
          reports: { title: 'System Reports & Insights', desc: 'Utilization charts, category statistics, and PDF export modules (P4 Owned).', icon: BarChart3 },
          org: { title: 'Department & Category Setup', desc: 'Create departments, child nodes, and edit categories custom structures (P1 Owned).', icon: Users }
        }[activeTab] || { title: 'System Node', desc: 'Under Construction.', icon: ShieldCheck };

        const TabIcon = tabConfig.icon;

        return (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-slate-800/80 rounded-2xl bg-slate-900/10 max-w-xl mx-auto text-center space-y-4 animate-fade-in">
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800/80 text-brand-400 shadow shadow-brand-500/5">
              <TabIcon className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{tabConfig.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{tabConfig.desc}</p>
            <div className="pt-2">
              <span className="text-[10px] font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-400 px-3 py-1.5 rounded-full uppercase tracking-wider">
                P2 Integration Context Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs leading-normal pt-2">
              All asset allocations, registration inputs, and transfer approvals triggered in Screens 4 & 5 will dynamically seed metrics into the backend database.
            </p>
          </div>
        );
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser} 
      setCurrentUser={setCurrentUser}
    >
      {renderTabContent()}
    </Layout>
  );
}

export default App;
