import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { ActivityLog, Profile } from '../../lib/types';
import { 
  History, Calendar, Search, RefreshCw, 
  ArrowRightLeft, CheckSquare, Wrench, Shield, Key
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await db.getActivityLogs();
      const allProfiles = await db.getProfiles();
      setLogs(allLogs);
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActorInfo = (actorId: string | null) => {
    if (!actorId) return { name: 'System', email: 'system@assetflow.com', role: 'system' };
    const prof = profiles.find(p => p.id === actorId);
    return prof || { name: 'Unknown User', email: 'unknown@assetflow.com', role: 'employee' };
  };

  const getActionDetails = (log: ActivityLog) => {
    const details = log.details || {};
    switch (log.action) {
      case 'asset_allocated':
        return `Allocated asset ${details.asset_tag || 'Unknown'} to ${details.assignee || 'Unknown'}`;
      case 'transfer_requested':
        return `Requested transfer for asset ${details.asset_tag || 'Unknown'}`;
      case 'transfer_approved':
        return `Approved transfer for asset ${details.asset_tag || 'Unknown'} to ${details.to_assignee || 'Unknown'}`;
      case 'booking_confirmed':
        return `Confirmed booking for shared resource ${details.asset_tag || 'Unknown'} (${new Date(details.start_time).toLocaleDateString()} ${new Date(details.start_time).toLocaleTimeString()} - ${new Date(details.end_time).toLocaleTimeString()})`;
      case 'maintenance_requested':
        return `Raised maintenance request for asset ${details.asset_tag || 'Unknown'} - "${details.issue || 'No details'}"`;
      case 'maintenance_approved':
        return `Approved maintenance request for asset ${details.asset_tag || 'Unknown'}`;
      case 'maintenance_resolved':
        return `Resolved maintenance request for asset ${details.asset_tag || 'Unknown'}`;
      case 'audit_cycle_created':
        return `Created audit cycle "${details.name || 'Unknown'}"`;
      case 'audit_item_verified':
        return `Verified audit item ${details.asset_tag || 'Unknown'} as ${details.status?.toUpperCase() || 'PENDING'} ${details.notes ? `(${details.notes})` : ''}`;
      case 'audit_cycle_closed':
        return `Closed audit cycle. Missing assets updated: ${details.missing_assets_count || 0}`;
      case 'profile_role_updated':
        return `Promoted user roles. Updated profile to ${details.new_role?.toUpperCase() || 'EMPLOYEE'}`;
      default:
        return `${log.action.replace('_', ' ')}`;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('allocat') || action.includes('transfer')) {
      return <ArrowRightLeft className="h-4 w-4 text-green-400" />;
    }
    if (action.includes('booking')) {
      return <CheckSquare className="h-4 w-4 text-blue-400" />;
    }
    if (action.includes('maintenance')) {
      return <Wrench className="h-4 w-4 text-amber-400" />;
    }
    if (action.includes('audit')) {
      return <Shield className="h-4 w-4 text-purple-400" />;
    }
    if (action.includes('role')) {
      return <Key className="h-4 w-4 text-pink-400" />;
    }
    return <History className="h-4 w-4 text-slate-400" />;
  };

  const filteredLogs = logs.filter(log => {
    const actor = getActorInfo(log.actor_id);
    const actorName = actor.name.toLowerCase();
    const actionText = getActionDetails(log).toLowerCase();
    const actionType = log.action;
    
    const matchesSearch = actorName.includes(searchTerm.toLowerCase()) || actionText.includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || actionType === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getUniqueActions = () => {
    const actions = new Set<string>();
    logs.forEach(l => actions.add(l.action));
    return Array.from(actions);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-500" /> Audit Trail & System Activity
        </h3>
        <button 
          onClick={fetchLogs}
          className="p-1.5 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by actor or activity details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <select 
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full md:w-48 bg-slate-950/60 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:outline-none"
        >
          <option value="all">All Actions</option>
          {getUniqueActions().map(act => (
            <option key={act} value={act}>{act.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Activity Timeline list */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 italic text-xs">
          No activity records found.
        </div>
      ) : (
        <div className="relative border-l border-slate-800 ml-4.5 space-y-6 pb-2">
          {filteredLogs.map(log => {
            const actor = getActorInfo(log.actor_id);
            const isExpanded = selectedLog === log.id;
            
            return (
              <div key={log.id} className="relative pl-7 text-xs">
                {/* Timeline Node dot */}
                <div className="absolute -left-[13px] top-1.5 p-1 bg-slate-950 border border-slate-800 rounded-full z-10">
                  {getActionIcon(log.action)}
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-3.5 hover:border-slate-700/60 transition space-y-1">
                  <div className="flex justify-between items-start gap-4">
                    <div className="font-semibold text-slate-200">
                      {getActionDetails(log)}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0 font-mono">
                      <Calendar className="h-3 w-3" /> {new Date(log.created_at || '').toLocaleDateString()} {new Date(log.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-[8px]">
                        {actor.name.charAt(0).toUpperCase()}
                      </span>
                      <strong className="text-slate-300">{actor.name}</strong> 
                      <span className="text-slate-500">({actor.email})</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="uppercase text-[9px] font-semibold text-slate-500 tracking-wider">
                      Role: {actor.role.replace('_', ' ')}
                    </span>
                    {log.details && (
                      <>
                        <span className="text-slate-500">•</span>
                        <button
                          onClick={() => setSelectedLog(isExpanded ? null : log.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {isExpanded ? 'Hide Payload' : 'Show Payload'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Expandable JSON details payload */}
                  {isExpanded && log.details && (
                    <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-850 font-mono text-[9px] text-indigo-300 overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
