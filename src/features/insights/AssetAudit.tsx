import React, { useState, useEffect } from 'react';
import { db, stateDb } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { AuditCycle, AuditItem, Profile, Asset, Department, AuditAuditor } from '../../lib/types';
import { 
  ClipboardCheck, Plus, CheckCircle2, AlertTriangle, HelpCircle, 
  Lock, Calendar, MapPin, Building, Search, X
} from 'lucide-react';

export const AssetAudit: React.FC = () => {
  const { profile } = useAuth();
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<AuditCycle | null>(null);
  const [items, setItems] = useState<(AuditItem & { asset?: Asset })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // New Cycle Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleDeptId, setNewCycleDeptId] = useState('');
  const [newCycleLocation, setNewCycleLocation] = useState('');
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Item Verification State
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'verified' | 'missing' | 'damaged'>('pending');
  const [verifyNotes, setVerifyNotes] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allCycles = await db.getAuditCycles();
      const allDepts = await db.getDepartments();
      const allProfiles = await db.getProfiles();
      const allAssets = await db.getAssets();
      
      setCycles(allCycles);
      setDepartments(allDepts);
      setEmployees(allProfiles);
      setAssets(allAssets);

      if (selectedCycle) {
        const updatedCycle = allCycles.find(c => c.id === selectedCycle.id);
        if (updatedCycle) setSelectedCycle(updatedCycle);
      }
    } catch (err) {
      console.error('Error fetching audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCycle) {
      fetchItems(selectedCycle.id);
    } else {
      setItems([]);
    }
  }, [selectedCycle]);

  const fetchItems = async (cycleId: string) => {
    try {
      const cycleItems = await db.getAuditItems(cycleId);
      const allAssets = await db.getAssets();
      const mapped = cycleItems.map(item => ({
        ...item,
        asset: allAssets.find(a => a.id === item.asset_id)
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Error fetching audit items:', err);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await db.createAuditCycle(
        {
          name: newCycleName,
          department_id: newCycleDeptId || null,
          location: newCycleLocation || null,
          date_range_start: newCycleStart || null,
          date_range_end: newCycleEnd || null,
          created_by: profile.id
        },
        selectedAuditors,
        selectedAssetIds,
        profile.id
      );
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchData();
    } catch (err) {
      console.error('Error creating audit cycle:', err);
    }
  };

  const resetCreateForm = () => {
    setNewCycleName('');
    setNewCycleDeptId('');
    setNewCycleLocation('');
    setNewCycleStart('');
    setNewCycleEnd('');
    setSelectedAuditors([]);
    setSelectedAssetIds([]);
  };

  const handleVerifyItem = async (itemId: string) => {
    if (!profile) return;
    try {
      await db.updateAuditItemStatus(itemId, verifyStatus, verifyNotes || null, profile.id);
      setEditingItem(null);
      setVerifyNotes('');
      if (selectedCycle) fetchItems(selectedCycle.id);
      fetchData();
    } catch (err) {
      console.error('Error updating verification status:', err);
    }
  };

  const handleCloseCycle = async (cycleId: string) => {
    if (!profile) return;
    if (!confirm('Are you sure you want to close this audit cycle? This will lock the audit and automatically mark any missing assets as LOST.')) return;
    try {
      await db.closeAuditCycle(cycleId, profile.id);
      fetchData();
    } catch (err) {
      console.error('Error closing cycle:', err);
    }
  };

  const toggleAuditorSelection = (id: string) => {
    setSelectedAuditors(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  // Calculations
  const getCycleProgress = (cycleId: string) => {
    // We calculate from items in local stateDb
    const itemsList = stateDb.get<AuditItem>('af_audit_items').filter((i: AuditItem) => i.audit_cycle_id === cycleId);
    if (itemsList.length === 0) return 0;
    const completed = itemsList.filter((i: AuditItem) => i.verification_status !== 'pending').length;
    return Math.round((completed / itemsList.length) * 100);
  };

  const filteredItems = items.filter(item => {
    const assetName = item.asset?.name?.toLowerCase() || '';
    const assetTag = item.asset?.tag?.toLowerCase() || '';
    const matchesSearch = assetName.includes(searchTerm.toLowerCase()) || assetTag.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: AuditItem['verification_status']) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1 w-max"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>;
      case 'missing':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-max"><X className="h-3.5 w-3.5" /> Missing</span>;
      case 'damaged':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max"><AlertTriangle className="h-3.5 w-3.5" /> Damaged</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-max"><HelpCircle className="h-3.5 w-3.5" /> Pending</span>;
    }
  };

  const isUserAuditor = (cycle: AuditCycle) => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.role === 'asset_manager') return true;
    const auditorsList = stateDb.get<AuditAuditor>('af_audit_auditors').filter((a: AuditAuditor) => a.audit_cycle_id === cycle.id);
    return auditorsList.some((a: AuditAuditor) => a.auditor_id === profile.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-indigo-500 animate-pulse" /> Asset Inventory Audits
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Conduct inventory checks, flag discrepancies, and ensure audit logs remain correct.
          </p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'asset_manager') && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 rounded-xl font-medium transition shadow-lg shadow-indigo-500/25 border border-indigo-500/30"
          >
            <Plus className="h-5 w-5" /> Start Audit Cycle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Audit Cycles List */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Active Audit Cycles</h3>
          {cycles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No audit cycles created yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {cycles.map(cycle => {
                const isSelected = selectedCycle?.id === cycle.id;
                const progress = getCycleProgress(cycle.id);
                const isClosed = cycle.status === 'closed';
                
                return (
                  <div 
                    key={cycle.id}
                    onClick={() => setSelectedCycle(cycle)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                          {cycle.name}
                          {isClosed && <Lock className="h-3.5 w-3.5 text-red-400" />}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                          {cycle.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cycle.location}</span>
                          )}
                          {cycle.department_id && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" /> 
                              {departments.find(d => d.id === cycle.department_id)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isClosed 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {cycle.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-350"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Audit Items Detail */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex flex-col min-h-[500px]">
          {selectedCycle ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {selectedCycle.name}
                    {selectedCycle.status === 'closed' && (
                      <span className="text-xs bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-normal"><Lock className="h-3 w-3" /> Locked</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                    {selectedCycle.date_range_start && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Start: {selectedCycle.date_range_start}</span>
                    )}
                    {selectedCycle.date_range_end && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> End: {selectedCycle.date_range_end}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5" /> 
                      Total: {items.length} items
                    </span>
                  </div>
                </div>

                {selectedCycle.status === 'open' && (profile?.role === 'admin' || profile?.role === 'asset_manager') && (
                  <button
                    onClick={() => handleCloseCycle(selectedCycle.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-500/25 rounded-xl text-xs font-semibold transition"
                  >
                    <Lock className="h-3.5 w-3.5" /> Close & Lock Audit
                  </button>
                )}
              </div>

              {/* Toolbar & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Search by asset tag or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {['all', 'pending', 'verified', 'missing', 'damaged'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border capitalize transition ${
                        statusFilter === st 
                          ? 'bg-indigo-950/50 text-indigo-400 border-indigo-500/40' 
                          : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:border-slate-700/60'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Asset Details</th>
                      <th className="py-3 px-4">Expected Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                      {selectedCycle.status === 'open' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-950/20 text-xs">
                        <td className="py-3 px-4">
                          {item.asset ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">{item.asset.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{item.asset.tag}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Unknown Asset</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{item.expected_location || 'Not Specified'}</td>
                        <td className="py-3 px-4">{getStatusBadge(item.verification_status)}</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400 text-[11px] line-clamp-1">{item.notes || '—'}</span>
                        </td>
                        {selectedCycle.status === 'open' && (
                          <td className="py-3 px-4 text-right">
                            {isUserAuditor(selectedCycle) ? (
                              <button
                                onClick={() => {
                                  setEditingItem(item.id);
                                  setVerifyStatus(item.verification_status);
                                  setVerifyNotes(item.notes || '');
                                }}
                                className="px-2.5 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-500/25 rounded-lg font-medium transition text-[10px]"
                              >
                                Verify
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Not Assigned</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500 italic text-xs">
                          No audit items match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ClipboardCheck className="h-14 w-14 text-slate-700 mb-3 animate-pulse" />
              <h4 className="text-slate-400 font-bold mb-1">No Audit Cycle Selected</h4>
              <p className="text-slate-500 text-xs max-w-sm">
                Select an active audit cycle from the list to view its items, update statuses, or perform checks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VERIFY ITEM DIALOG */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-accordion-down shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-slate-100 text-sm">Verify Asset Inventory Item</h4>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'verified', label: 'Verified', color: 'border-green-500 text-green-400 hover:bg-green-500/10' },
                    { val: 'missing', label: 'Missing', color: 'border-red-500 text-red-400 hover:bg-red-500/10' },
                    { val: 'damaged', label: 'Damaged', color: 'border-amber-500 text-amber-400 hover:bg-amber-500/10' }
                  ].map(st => (
                    <button
                      key={st.val}
                      onClick={() => setVerifyStatus(st.val as any)}
                      className={`px-3 py-2 border rounded-xl font-medium text-xs transition flex justify-center items-center ${
                        verifyStatus === st.val 
                          ? `bg-slate-950/80 border-slate-300 text-slate-100` 
                          : `${st.color}`
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Verification Notes</label>
                <textarea 
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Verified physically at Bengaluru office, chair handles slightly loose but in good order."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-850 text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-850/30 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleVerifyItem(editingItem)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl text-xs font-semibold transition"
              >
                Save Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE AUDIT CYCLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 animate-accordion-down shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-slate-100 text-sm">Create New Audit Cycle</h4>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Cycle Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCycleName}
                    onChange={(e) => setNewCycleName(e.target.value)}
                    placeholder="e.g. Q3 Electronics Audit"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Location</label>
                  <input 
                    type="text" 
                    value={newCycleLocation}
                    onChange={(e) => setNewCycleLocation(e.target.value)}
                    placeholder="e.g. Bengaluru Office"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Department</label>
                  <select 
                    value={newCycleDeptId}
                    onChange={(e) => setNewCycleDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</label>
                    <input 
                      type="date" 
                      value={newCycleStart}
                      onChange={(e) => setNewCycleStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date</label>
                    <input 
                      type="date" 
                      value={newCycleEnd}
                      onChange={(e) => setNewCycleEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Select Auditors */}
              <div className="space-y-2 border-t border-slate-800/80 pt-4">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assign Auditors</label>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-900/60 rounded text-xs text-slate-300">
                      <input 
                        type="checkbox"
                        checked={selectedAuditors.includes(emp.id)}
                        onChange={() => toggleAuditorSelection(emp.id)}
                        className="rounded bg-slate-900 border-slate-850 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span>{emp.name}</span>
                        <span className="text-[9px] text-slate-500 ml-1.5 uppercase font-semibold">({emp.role.replace('_', ' ')})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Select Assets */}
              <div className="space-y-2 border-t border-slate-800/80 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Assets to Audit</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Filter by department if selected
                      const activeAssets = assets.filter(a => a.status !== 'retired' && a.status !== 'disposed');
                      const filtered = newCycleDeptId ? activeAssets.filter(a => a.department_id === newCycleDeptId) : activeAssets;
                      setSelectedAssetIds(filtered.map(a => a.id));
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                  >
                    Select All Matching
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  {assets
                    .filter(a => a.status !== 'retired' && a.status !== 'disposed')
                    .filter(a => !newCycleDeptId || a.department_id === newCycleDeptId)
                    .map(a => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-900/60 rounded text-xs text-slate-300">
                        <input 
                          type="checkbox"
                          checked={selectedAssetIds.includes(a.id)}
                          onChange={() => toggleAssetSelection(a.id)}
                          className="rounded bg-slate-900 border-slate-850 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex flex-col">
                          <span>{a.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{a.tag} · {a.status}</span>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-800/80 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-850 text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-850/30 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newCycleName || selectedAssetIds.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 disabled:opacity-50 rounded-xl text-xs font-semibold transition"
                >
                  Create Cycle ({selectedAssetIds.length} Assets)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
