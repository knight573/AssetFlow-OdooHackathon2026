import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Layers, 
  Bell, 
  Users, 
  ChevronDown, 
  LayoutDashboard, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Menu, 
  X
} from 'lucide-react';
import type { Profile, UserRole } from '../lib/types';
import { localDb } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  setCurrentUser 
}: LayoutProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load profiles for role switcher
    setProfiles(localDb.getProfiles());
    // Load notifications
    setNotifications(localDb.getNotifications().filter(n => n.user_id === currentUser.id));
  }, [currentUser.id]);

  const handleRoleChange = (profileId: string) => {
    const selected = profiles.find(p => p.id === profileId);
    if (selected) {
      setCurrentUser(selected);
      setShowRoleSelector(false);
      // Reload notifications for the selected user
      setNotifications(localDb.getNotifications().filter(n => n.user_id === selected.id));
    }
  };

  const markAllRead = () => {
    const allNotifs = localDb.getNotifications();
    const updatedNotifs = allNotifs.map(n => n.user_id === currentUser.id ? { ...n, is_read: true } : n);
    localDb.saveNotifications(updatedNotifs);
    setNotifications(updatedNotifs.filter(n => n.user_id === currentUser.id));
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: ['admin', 'asset_manager', 'department_head', 'employee'], badge: null, isMocked: true },
    { id: 'directory', label: 'Asset Directory', icon: Boxes, role: ['admin', 'asset_manager', 'department_head', 'employee'], badge: null, isMocked: false },
    { id: 'allocations', label: 'Allocations & Transfers', icon: Layers, role: ['admin', 'asset_manager', 'department_head', 'employee'], badge: null, isMocked: false },
    { id: 'booking', label: 'Resource Booking', icon: Calendar, role: ['admin', 'asset_manager', 'department_head', 'employee'], badge: null, isMocked: true },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, role: ['admin', 'asset_manager', 'department_head', 'employee'], badge: '3', isMocked: true },
    { id: 'audit', label: 'Asset Audit', icon: ClipboardCheck, role: ['admin', 'asset_manager'], badge: null, isMocked: true },
    { id: 'reports', label: 'Reports & Insights', icon: BarChart3, role: ['admin', 'asset_manager', 'department_head'], badge: null, isMocked: true },
    { id: 'org', label: 'Org Setup', icon: Users, role: ['admin'], badge: null, isMocked: true },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'asset_manager': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'department_head': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass border-r border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20">
            <Boxes className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              AssetFlow
            </h1>
            <p className="text-xs text-slate-400 font-medium">Enterprise ERP v1.0</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
            Navigation Modules
          </div>
          {navigationItems.map((item) => {
            const hasAccess = item.role.includes(currentUser.role);
            if (!hasAccess) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-600 text-white font-medium shadow-md shadow-brand-600/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.isMocked && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50">
                      P1/P3/P4
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Current User Footnote */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/25">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-500 flex items-center justify-center font-bold text-white shadow shadow-indigo-500/10">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass border-b border-slate-800/80 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/60 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 font-medium">
              <span>Modules</span>
              <span>/</span>
              <span className="text-slate-100 capitalize">
                {activeTab === 'directory' ? 'Asset Registration & Directory' : activeTab === 'allocations' ? 'Allocations & Transfers' : activeTab}
              </span>
              {navigationItems.find(n => n.id === activeTab)?.isMocked && (
                <span className="ml-2 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold animate-pulse">
                  Mocked View
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Demo Role Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <span className="text-slate-500">Actor Simulator:</span>
                <span className="text-brand-300 font-bold">{currentUser.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {showRoleSelector && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-slide-up">
                  <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1.5 border-b border-slate-800/80 mb-1">
                    Select Test Account (RBAC simulation)
                  </div>
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleRoleChange(profile.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        currentUser.id === profile.id 
                          ? 'bg-brand-600/20 text-brand-300 font-medium' 
                          : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-[10px] text-slate-500">{profile.email}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleBadgeColor(profile.role)}`}>
                        {profile.role.split('_')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors shadow-sm"
              >
                <Bell className="h-5 w-5" />
                {getUnreadCount() > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                    {getUnreadCount()}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-slide-up">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <span className="text-xs font-bold text-slate-200">Alerts & Notifications</span>
                    <button 
                      onClick={markAllRead} 
                      className="text-[10px] text-brand-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications for this account.</p>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-lg border transition-all text-xs ${
                            n.is_read 
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-400' 
                              : 'bg-brand-500/5 border-brand-500/20 text-slate-200'
                          }`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[9px] text-slate-500 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden flex justify-start">
          <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col p-4 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="h-6 w-6 text-brand-500" />
                <span className="font-bold text-white text-lg">AssetFlow</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {navigationItems.map((item) => {
                const hasAccess = item.role.includes(currentUser.role);
                if (!hasAccess) return null;
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white font-medium' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.isMocked && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                        Mocked
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
