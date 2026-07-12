import React from 'react';
import { useAuth } from '../lib/auth';
import { UserRole } from '../lib/types';
import { ShieldAlert } from 'lucide-react';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!role || !roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-red-500/20 text-center max-w-lg mx-auto my-12 animate-pulse-slow">
        <div className="bg-red-950/40 p-4 rounded-full border border-red-500/30 text-red-400 mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Access Restricted</h3>
        <p className="text-sm text-slate-400 mb-6">
          This screen is restricted to <strong>{roles.join(' or ')}</strong> roles. 
          Your current role is <strong>{role || 'none'}</strong>.
        </p>
        <div className="text-xs text-slate-500 italic">
          Tip: You can use the Quick Role Switcher in the top right header to simulate other roles for testing!
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
