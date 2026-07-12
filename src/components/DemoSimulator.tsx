import React, { useState, useEffect } from 'react';
import { db, stateDb } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Asset, Profile, Department, MaintenanceRequest } from '../lib/types';
import { 
  Terminal, UserPlus, 
  Layers, Calendar, Wrench, AlertTriangle, AlertCircle, X 
} from 'lucide-react';

export const DemoSimulator: React.FC<{ isOpen: boolean; onClose: () => void; onTriggerRefresh: () => void }> = ({ isOpen, onClose, onTriggerRefresh }) => {
  const { profile } = useAuth();
  
  // Lists for forms
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);

  // Simulation Form States
  // P1 Promotion
  const [promoUserId, setPromoUserId] = useState('');
  const [promoRole, setPromoRole] = useState<'employee' | 'department_head' | 'asset_manager' | 'admin'>('employee');

  // P2 Allocation
  const [allocAssetId, setAllocAssetId] = useState('');
  const [allocEmployeeId, setAllocEmployeeId] = useState('');
  const [allocReturnDate] = useState('2026-07-30');
  const [allocWarning, setAllocWarning] = useState<string | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [transferToId, setTransferToId] = useState('');

  // P3 Booking
  const [bookAssetId, setBookAssetId] = useState('');
  const [bookStartTime, setBookStartTime] = useState('');
  const [bookEndTime, setBookEndTime] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');
  const [bookWarning, setBookWarning] = useState<string | null>(null);

  // P3 Maintenance
  const [maintAssetId, setMaintAssetId] = useState('');
  const [maintIssue, setMaintIssue] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const p = await db.getProfiles();
    const a = await db.getAssets();
    const d = await db.getDepartments();
    const m = await db.getMaintenanceRequests();
    setProfiles(p);
    setAssets(a);
    setDepartments(d);
    setMaintenance(m);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !promoUserId) return;
    try {
      await db.updateProfileRole(promoUserId, promoRole, profile.id);
      loadData();
      onTriggerRefresh();
      alert('Role promoted successfully. Check Activity Logs!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !allocAssetId || !allocEmployeeId) return;
    
    setAllocWarning(null);
    
    // Perform P2 double-allocation check
    const existing = stateDb.get<any>('af_allocations')
      .find(a => a.asset_id === allocAssetId && a.status === 'active');
      
    if (existing) {
      const holder = profiles.find(p => p.id === existing.employee_id);
      const dept = departments.find(d => d.id === holder?.department_id)?.name || 'Unknown';
      setAllocWarning(`Already Allocated to ${holder?.name || 'Unknown'} (${dept}). Allocate blocked.`);
      setShowTransferForm(true);
      return;
    }

    try {
      await db.createAllocation({
        asset_id: allocAssetId,
        employee_id: allocEmployeeId,
        department_id: profiles.find(p => p.id === allocEmployeeId)?.department_id || null,
        allocated_by: profile.id,
        expected_return_date: allocReturnDate,
        returned_at: null,
        return_condition_notes: null,
        status: 'active'
      }, profile.id);
      
      setAllocAssetId('');
      setAllocEmployeeId('');
      loadData();
      onTriggerRefresh();
      alert('Asset allocated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !allocAssetId || !transferToId) return;
    try {
      const activeAlloc = stateDb.get<any>('af_allocations')
        .find(a => a.asset_id === allocAssetId && a.status === 'active');
        
      await db.createTransferRequest({
        asset_id: allocAssetId,
        from_employee_id: activeAlloc ? activeAlloc.employee_id : null,
        to_employee_id: transferToId,
        reason: transferReason,
        requested_by: profile.id,
        approved_by: null
      }, profile.id);

      setShowTransferForm(false);
      setAllocWarning(null);
      setTransferReason('');
      setAllocAssetId('');
      loadData();
      onTriggerRefresh();
      alert('Transfer Request submitted to Asset Managers!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !bookAssetId || !bookStartTime || !bookEndTime) return;
    
    setBookWarning(null);
    const startIso = new Date(bookStartTime).toISOString();
    const endIso = new Date(bookEndTime).toISOString();

    const bookingResult = await db.createBooking({
      resource_asset_id: bookAssetId,
      booked_by: profile.id,
      purpose: bookPurpose,
      start_time: startIso,
      end_time: endIso
    }, profile.id);

    if (!bookingResult) {
      setBookWarning('Conflict — slot is unavailable');
      return;
    }

    setBookAssetId('');
    setBookPurpose('');
    setBookStartTime('');
    setBookEndTime('');
    loadData();
    onTriggerRefresh();
    alert('Resource booked successfully!');
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !maintAssetId) return;
    try {
      await db.createMaintenanceRequest({
        asset_id: maintAssetId,
        raised_by: profile.id,
        issue_description: maintIssue,
        priority: 'medium',
        photo_url: null
      }, profile.id);

      setMaintAssetId('');
      setMaintIssue('');
      loadData();
      onTriggerRefresh();
      alert('Maintenance request raised successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleProgressMaintenance = async (id: string, nextStatus: MaintenanceRequest['status']) => {
    if (!profile) return;
    try {
      const updates: Partial<MaintenanceRequest> = {};
      if (nextStatus === 'technician_assigned') {
        updates.technician_name = 'Vikram Malhotra (Technician)';
      }
      await db.updateMaintenanceRequest(id, nextStatus, profile.id, updates);
      loadData();
      onTriggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-in">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-indigo-400" /> Team Action Simulator
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
        {/* P1: Promote Roles */}
        <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <h4 className="font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" /> P1 — Identity & Roles
          </h4>
          <form onSubmit={handlePromote} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={promoUserId}
                onChange={(e) => setPromoUserId(e.target.value)}
                required
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="">User...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
              <select 
                value={promoRole}
                onChange={(e) => setPromoRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="employee">Employee</option>
                <option value="department_head">Dept Head</option>
                <option value="asset_manager">Asset Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded font-semibold text-slate-200">
              Promote Role
            </button>
          </form>
        </div>

        {/* P2: Assets & Allocations */}
        <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <h4 className="font-extrabold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4" /> P2 — Asset Allocations
          </h4>
          
          <form onSubmit={handleAllocate} className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Select Asset</label>
              <select 
                value={allocAssetId}
                onChange={(e) => {
                  setAllocAssetId(e.target.value);
                  setAllocWarning(null);
                  setShowTransferForm(false);
                }}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="">Choose Asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag} - {a.status})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Allocate To</label>
              <select 
                value={allocEmployeeId}
                onChange={(e) => setAllocEmployeeId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="">Choose Employee...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {allocWarning && (
              <div className="p-2 bg-red-950/50 border border-red-500/30 text-red-400 rounded flex gap-1.5 items-start">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{allocWarning}</span>
              </div>
            )}

            {!showTransferForm ? (
              <button type="submit" className="w-full py-1.5 bg-green-600 hover:bg-green-500 rounded font-semibold text-slate-200">
                Allocate Asset
              </button>
            ) : (
              <div className="border-t border-slate-800/80 pt-2 space-y-2">
                <div className="font-semibold text-[10px] text-indigo-400 uppercase">Offer Transfer Form</div>
                <div className="space-y-1">
                  <select 
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
                  >
                    <option value="">Transfer to Employee...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <input 
                    type="text" 
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Reason for transfer request..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
                  />
                </div>
                <button 
                  onClick={handleTransferRequest}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded font-semibold text-slate-200"
                >
                  Submit Transfer Request
                </button>
              </div>
            )}
          </form>
        </div>

        {/* P3: Resource Booking */}
        <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <h4 className="font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> P3 — Resource Bookings
          </h4>
          <form onSubmit={handleBook} className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Select Bookable Asset</label>
              <select 
                value={bookAssetId}
                onChange={(e) => {
                  setBookAssetId(e.target.value);
                  setBookWarning(null);
                }}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="">Choose Resource...</option>
                {assets.filter(a => a.is_bookable).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-semibold block">Start Time</label>
                <input 
                  type="datetime-local" 
                  value={bookStartTime}
                  onChange={(e) => setBookStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-semibold block">End Time</label>
                <input 
                  type="datetime-local" 
                  value={bookEndTime}
                  onChange={(e) => setBookEndTime(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <input 
                type="text" 
                value={bookPurpose}
                onChange={(e) => setBookPurpose(e.target.value)}
                placeholder="Booking Purpose (e.g. Weekly Standup)"
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              />
            </div>

            {bookWarning && (
              <div className="p-2 bg-red-950/50 border border-red-500/30 text-red-400 rounded flex gap-1.5 items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bookWarning}</span>
              </div>
            )}

            <button type="submit" className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-semibold text-slate-200">
              Confirm Time-slot
            </button>
          </form>
        </div>

        {/* P3: Maintenance Kanban */}
        <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <h4 className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="h-4 w-4" /> P3 — Maintenance & Kanban
          </h4>
          
          <form onSubmit={handleCreateMaintenance} className="space-y-2.5 border-b border-slate-800/80 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={maintAssetId}
                onChange={(e) => setMaintAssetId(e.target.value)}
                required
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              >
                <option value="">Asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
              <input 
                type="text" 
                value={maintIssue}
                onChange={(e) => setMaintIssue(e.target.value)}
                required
                placeholder="Issue description..."
                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-200"
              />
            </div>
            <button type="submit" className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 rounded font-semibold text-slate-200">
              Raise Repair Request
            </button>
          </form>

          {/* Kanban simulator list */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            <div className="font-semibold text-[10px] text-slate-400">Current Repairs:</div>
            {maintenance.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">No maintenance tickets.</p>
            ) : (
              maintenance.map(m => {
                const asset = assets.find(a => a.id === m.asset_id);
                return (
                  <div key={m.id} className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[10px] text-slate-200">{asset?.name} ({asset?.tag})</span>
                      <span className={`text-[8px] px-1 rounded uppercase font-bold ${
                        m.status === 'pending' ? 'bg-red-500/20 text-red-400' :
                        m.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400' :
                        m.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{m.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{m.issue_description}</p>
                    
                    <div className="flex gap-1.5 justify-end mt-1">
                      {m.status === 'pending' && (
                        <button 
                          onClick={() => handleProgressMaintenance(m.id, 'approved')}
                          className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-[9px] text-slate-200 font-medium rounded"
                        >
                          Approve ticket
                        </button>
                      )}
                      {m.status === 'approved' && (
                        <button 
                          onClick={() => handleProgressMaintenance(m.id, 'technician_assigned')}
                          className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-[9px] text-slate-200 font-medium rounded"
                        >
                          Assign Technician
                        </button>
                      )}
                      {m.status === 'technician_assigned' && (
                        <button 
                          onClick={() => handleProgressMaintenance(m.id, 'in_progress')}
                          className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-[9px] text-slate-200 font-medium rounded"
                        >
                          Start Repair
                        </button>
                      )}
                      {m.status === 'in_progress' && (
                        <button 
                          onClick={() => handleProgressMaintenance(m.id, 'resolved')}
                          className="px-1.5 py-0.5 bg-green-600 hover:bg-green-500 text-[9px] text-slate-200 font-medium rounded"
                        >
                          Resolve & Back Available
                        </button>
                      )}
                    </div>
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
