import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './lib/auth';
import { RequireRole } from './components/RequireRole';
import { AssetAudit } from './features/insights/AssetAudit';
import { Reports } from './features/insights/Reports';
import { ActivityLogs } from './features/insights/ActivityLogs';
import { Notifications } from './features/insights/Notifications';
import { DemoSimulator } from './components/DemoSimulator';
import { stateDb } from './lib/supabase';
import { Asset, Allocation, Booking, MaintenanceRequest } from './lib/types';
import { 
  Layers, ClipboardCheck, TrendingUp, History, Bell, 
  Terminal, ShieldAlert, LogOut, LayoutDashboard, 
  ArrowRight, UserCheck
} from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { loginMock } = useAuth();
  const [email, setEmail] = useState('admin@assetflow.com');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = await loginMock(email);
    if (!success) {
      setError('Invalid email address. Choose from admin@assetflow.com, arjun@assetflow.com, priya@assetflow.com, or rohan@assetflow.com.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="bg-indigo-950/50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Layers className="h-7 w-7 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">AssetFlow ERP</h1>
          <p className="text-xs text-slate-400">Enterprise Asset & Resource Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Demo User Email</label>
            <select 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="admin@assetflow.com">admin@assetflow.com (Admin Role)</option>
              <option value="arjun@assetflow.com">arjun@assetflow.com (Asset Manager)</option>
              <option value="priya@assetflow.com">priya@assetflow.com (Dept Head)</option>
              <option value="rohan@assetflow.com">rohan@assetflow.com (Employee)</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-100 transition shadow-lg shadow-indigo-500/20 border border-indigo-500/30"
          >
            Enter Dashboard
          </button>
        </form>

        <div className="border-t border-slate-850 pt-4 text-center">
          <span className="text-[10px] text-slate-500 italic block">
            Collaborative Hackathon Build · P4 Module Setup
          </span>
        </div>
      </div>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    assets: 0,
    allocations: 0,
    bookings: 0,
    maintenance: 0,
    overdue: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  React.useEffect(() => {
    // Collect summary statistics from stateDb
    const assetsList = stateDb.get<Asset>('af_assets');
    const allocsList = stateDb.get<Allocation>('af_allocations');
    const bookingsList = stateDb.get<Booking>('af_bookings');
    const maintList = stateDb.get<MaintenanceRequest>('af_maintenance_requests');
    const logsList = stateDb.get<any>('af_activity_logs');
    
    // Count overdue: allocations expected_return_date has passed today
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = allocsList.filter(a => a.status === 'active' && a.expected_return_date && a.expected_return_date < today).length;

    setStats({
      assets: assetsList.length,
      allocations: allocsList.filter(a => a.status === 'active').length,
      bookings: bookingsList.filter(b => b.status === 'upcoming' || b.status === 'ongoing').length,
      maintenance: maintList.filter(m => m.status !== 'resolved' && m.status !== 'rejected').length,
      overdue: overdueCount
    });

    setRecentActivities(logsList.slice(0, 5));
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/40 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 z-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-100">Welcome back, {profile?.name}!</h2>
          <p className="text-xs text-indigo-300">
            You are logged in as <strong className="uppercase">{profile?.role.replace('_', ' ')}</strong> in the AssetFlow ERP system.
          </p>
        </div>
        
        {stats.overdue > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-pulse z-10 shrink-0">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>Warning: {stats.overdue} Asset Returns are Overdue!</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Assets', val: stats.assets, desc: 'Total tracked inventory' },
          { label: 'Active Checkouts', val: stats.allocations, desc: 'Assets assigned to users' },
          { label: 'Active Bookings', val: stats.bookings, desc: 'Shared conference/vehicles' },
          { label: 'Pending Repairs', val: stats.maintenance, desc: 'Requests needing attention' }
        ].map((c, i) => (
          <div key={i} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between h-[110px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{c.label}</span>
            <div>
              <span className="text-3xl font-black text-slate-100">{c.val}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Quick Action Command</h3>
          <div className="space-y-3">
            {[
              { label: 'View Inventory Audit Cycles', to: '/audits', desc: 'Screen 8: Verify active inventory checklists', icon: <ClipboardCheck className="h-4.5 w-4.5 text-indigo-400" /> },
              { label: 'Access Analytical Reports', to: '/reports', desc: 'Screen 9: Recharts utilization breakdown', icon: <TrendingUp className="h-4.5 w-4.5 text-green-400" /> },
              { label: 'Inspect Activity logs', to: '/logs', desc: 'Screen 10: System-wide audit trail timelines', icon: <History className="h-4.5 w-4.5 text-purple-400" /> }
            ].map((link, index) => (
              <Link 
                key={index} 
                to={link.to}
                className="block p-3 bg-slate-950/40 hover:bg-indigo-950/20 border border-slate-850 hover:border-indigo-500/20 rounded-xl transition group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-slate-900 border border-slate-800 rounded-lg">{link.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">{link.label}</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities Panel */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex justify-between items-center">
            <span>Recent Activity Trail</span>
            <Link to="/logs" className="text-[10px] text-indigo-400 hover:text-indigo-300">View All</Link>
          </h3>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No recent activity found.</p>
            ) : (
              recentActivities.map((log, idx) => {
                const isAudit = log.action.includes('audit');
                const isAlloc = log.action.includes('allocate') || log.action.includes('transfer');
                const isBooking = log.action.includes('booking');
                return (
                  <div key={idx} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full inline-block ${
                        isAudit ? 'bg-purple-500' :
                        isAlloc ? 'bg-green-500' :
                        isBooking ? 'bg-blue-500' : 'bg-slate-500'
                      }`} />
                      <div>
                        <span className="font-semibold text-slate-300">
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-slate-500 text-[10px] ml-2 font-mono">
                          {new Date(log.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 max-w-[200px] truncate text-right">
                      {log.details?.asset_tag || log.details?.name || 'Details logged'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavigationLayout: React.FC = () => {
  const { profile, logout, switchRole } = useAuth();
  const location = useLocation();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getActiveTabClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition border ${
      isActive 
        ? 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5' 
        : 'border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
    }`;
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-300 relative overflow-hidden" key={refreshKey}>
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl shrink-0 flex flex-col justify-between p-5 relative z-20">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="p-2 bg-indigo-950/40 rounded-xl border border-indigo-500/25">
              <Layers className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-sm tracking-wide">AssetFlow ERP</span>
              <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">Knight Module</span>
            </div>
          </Link>

          <nav className="space-y-1.5">
            <Link to="/" className={getActiveTabClass('/')}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/audits" className={getActiveTabClass('/audits')}>
              <ClipboardCheck className="h-4 w-4" /> Asset Audits
            </Link>
            <Link to="/reports" className={getActiveTabClass('/reports')}>
              <TrendingUp className="h-4 w-4" /> Reports & Analytics
            </Link>
            <Link to="/logs" className={getActiveTabClass('/logs')}>
              <History className="h-4 w-4" /> Activity Logs
            </Link>
            <Link to="/notifications" className={getActiveTabClass('/notifications')}>
              <Bell className="h-4 w-4" /> Notifications Center
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <button 
            onClick={() => setIsSimulatorOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-200 transition"
          >
            <Terminal className="h-4 w-4 text-indigo-400 animate-pulse" /> Action Simulator
          </button>

          <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{profile?.name}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">{profile?.role.replace('_', ' ')}</span>
            </div>
            <button 
              onClick={logout}
              title="Logout"
              className="p-1.5 hover:bg-red-950/40 border border-transparent hover:border-red-500/25 rounded-lg text-slate-400 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top Header Panel */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md flex justify-between items-center px-8 relative z-20 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              Demo Workspace Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 border border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> Simulate Role:
              </span>
              <select 
                value={profile?.role || 'employee'}
                onChange={(e) => switchRole(e.target.value as any)}
                className="bg-transparent text-slate-200 border-none font-bold text-xs focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="employee">Employee</option>
                <option value="department_head">Dept Head</option>
                <option value="asset_manager">Asset Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button 
              onClick={() => setIsSimulatorOpen(true)}
              className="p-2 border border-slate-800 bg-slate-900/60 rounded-xl hover:text-indigo-400 transition relative"
            >
              <Terminal className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Inner Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/audits" element={
              <RequireRole roles={['admin', 'asset_manager', 'department_head']}>
                <AssetAudit />
              </RequireRole>
            } />
            <Route path="/reports" element={<Reports />} />
            <Route path="/logs" element={
              <RequireRole roles={['admin', 'asset_manager']}>
                <ActivityLogs />
              </RequireRole>
            } />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      {/* Simulator Drawer overlay */}
      <DemoSimulator 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
        onTriggerRefresh={triggerRefresh}
      />
    </div>
  );
};

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <NavigationLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
