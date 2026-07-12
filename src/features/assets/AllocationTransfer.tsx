import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  RotateCcw, 
  ArrowRightLeft, 
  Check, 
  X, 
  Info,
  Calendar,
  ClipboardList,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import type { Asset, Profile, Allocation, TransferRequest, AssetCondition } from '../../lib/types';
import { localDb } from '../../lib/supabase';
import { logActivity } from '../../lib/activity';

interface AllocationTransferProps {
  currentUser: Profile;
  preselectedAssetId?: string;
  initialAction?: 'allocate' | 'return' | 'transfer';
  clearPreselect: () => void;
}

export default function AllocationTransfer({ 
  currentUser, 
  preselectedAssetId, 
  initialAction = 'allocate',
  clearPreselect 
}: AllocationTransferProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'allocate' | 'transfers'>('allocate');

  // Database States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);

  // Form states - Allocate
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allocationMessage, setAllocationMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Form states - Return
  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('Good');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnMessage, setReturnMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Transfer Request Form inside block
  const [transferNotes, setTransferNotes] = useState('');

  // Double allocation checker state
  const [activeAllocation, setActiveAllocation] = useState<Allocation | null>(null);
  const [allocationHolder, setAllocationHolder] = useState<Profile | null>(null);

  // Reload Data
  const loadData = () => {
    setAssets(localDb.getAssets());
    setProfiles(localDb.getProfiles());
    setAllocations(localDb.getAllocations());
    setTransfers(localDb.getTransfers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Preselection logic from Directory screen
  useEffect(() => {
    if (preselectedAssetId) {
      const allAssets = localDb.getAssets();
      const asset = allAssets.find(a => a.id === preselectedAssetId);
      if (asset) {
        if (initialAction === 'return') {
          setReturnAssetId(preselectedAssetId);
        } else if (initialAction === 'transfer') {
          setSelectedAssetId(preselectedAssetId);
          // Let's ensure tab is allocate since transfer starts by selecting the conflicting asset
          setActiveSubTab('allocate');
        } else {
          setSelectedAssetId(preselectedAssetId);
          setActiveSubTab('allocate');
        }
      }
      clearPreselect();
    }
  }, [preselectedAssetId, initialAction]);

  // Check double allocation on asset select
  useEffect(() => {
    if (!selectedAssetId) {
      setActiveAllocation(null);
      setAllocationHolder(null);
      return;
    }

    const activeAlloc = allocations.find(al => al.asset_id === selectedAssetId && al.status === 'active');
    if (activeAlloc) {
      setActiveAllocation(activeAlloc);
      const holder = profiles.find(p => p.id === activeAlloc.profile_id);
      setAllocationHolder(holder || null);
      
      // Notify about existing allocation
      setAllocationMessage({
        type: 'warning',
        text: `Double-Allocation Warning: This item is already allocated to ${holder ? holder.name : 'another user'}. You can submit a Transfer Request instead.`
      });
    } else {
      setActiveAllocation(null);
      setAllocationHolder(null);
      setAllocationMessage(null);
    }
  }, [selectedAssetId, allocations, profiles]);

  // Handle Allocate
  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setAllocationMessage(null);

    if (!selectedAssetId) {
      setAllocationMessage({ type: 'error', text: 'Please select an asset to allocate.' });
      return;
    }
    if (!selectedProfileId) {
      setAllocationMessage({ type: 'error', text: 'Please select an employee assignee.' });
      return;
    }

    // Double check active allocation to prevent race conditions
    const activeAlloc = allocations.find(al => al.asset_id === selectedAssetId && al.status === 'active');
    if (activeAlloc) {
      setAllocationMessage({ type: 'error', text: 'Blocked: Asset is already active. Use transfer flow.' });
      return;
    }

    const newAllocation: Allocation = {
      id: 'alloc-' + Math.random().toString(36).substring(2, 11),
      asset_id: selectedAssetId,
      profile_id: selectedProfileId,
      status: 'active',
      allocated_at: new Date().toISOString(),
      expected_return_at: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined,
      notes: allocationNotes.trim() || undefined,
      created_at: new Date().toISOString()
    };

    // Update asset status
    const allAssets = localDb.getAssets();
    const updatedAssets = allAssets.map(a => a.id === selectedAssetId ? { ...a, status: 'allocated' as const } : a);
    localDb.saveAssets(updatedAssets);

    // Save allocation
    const allAllocations = localDb.getAllocations();
    localDb.saveAllocations([...allAllocations, newAllocation]);

    const targetAsset = allAssets.find(a => a.id === selectedAssetId);
    const assignee = profiles.find(p => p.id === selectedProfileId);

    // Log Activity
    logActivity({
      actorId: currentUser.id,
      action: 'asset_allocated',
      entityType: 'asset',
      entityId: selectedAssetId,
      details: {
        asset_tag: targetAsset?.tag,
        asset_name: targetAsset?.name,
        assignee: assignee?.name
      },
      notifyUserId: selectedProfileId,
      notifyMessage: `Asset ${targetAsset?.tag} - "${targetAsset?.name}" has been allocated to you. Expected return: ${expectedReturnDate || 'Indefinite'}.`,
      notifyType: 'allocation'
    });

    setAllocationMessage({ type: 'success', text: `Successfully allocated asset to ${assignee?.name}!` });
    setSelectedAssetId('');
    setSelectedProfileId('');
    setExpectedReturnDate('');
    setAllocationNotes('');
    loadData();
  };

  // Submit Transfer Request (when asset is already allocated)
  const handleRequestTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setAllocationMessage(null);

    if (!selectedAssetId || !activeAllocation || !allocationHolder) {
      setAllocationMessage({ type: 'error', text: 'Invalid transfer details.' });
      return;
    }
    if (!selectedProfileId) {
      setAllocationMessage({ type: 'error', text: 'Select a target transfer recipient.' });
      return;
    }
    if (selectedProfileId === allocationHolder.id) {
      setAllocationMessage({ type: 'error', text: 'Recipient cannot be the current holder.' });
      return;
    }

    const newTransfer: TransferRequest = {
      id: 'trans-' + Math.random().toString(36).substring(2, 11),
      asset_id: selectedAssetId,
      from_profile_id: allocationHolder.id,
      to_profile_id: selectedProfileId,
      status: 'pending',
      requested_at: new Date().toISOString(),
      notes: transferNotes.trim() || undefined,
      created_at: new Date().toISOString()
    };

    // Save transfer request
    const allTransfers = localDb.getTransfers();
    localDb.saveTransfers([...allTransfers, newTransfer]);

    const targetAsset = assets.find(a => a.id === selectedAssetId);
    const destinationUser = profiles.find(p => p.id === selectedProfileId);

    // Log Activity
    logActivity({
      actorId: currentUser.id,
      action: 'transfer_requested',
      entityType: 'transfer_request',
      entityId: newTransfer.id,
      details: {
        asset_tag: targetAsset?.tag,
        asset_name: targetAsset?.name,
        from_name: allocationHolder.name,
        to_name: destinationUser?.name
      },
      // Notify department head or manager for approval
      notifyUserId: allocationHolder.department_id ? 
        (profiles.find(p => p.department_id === allocationHolder.department_id && p.role === 'department_head')?.id || currentUser.id) : 
        currentUser.id,
      notifyMessage: `New transfer request submitted for ${targetAsset?.tag} to ${destinationUser?.name}. Requires approval.`,
      notifyType: 'transfer'
    });

    setAllocationMessage({ type: 'success', text: `Transfer request submitted from ${allocationHolder.name} to ${destinationUser?.name}!` });
    setSelectedAssetId('');
    setSelectedProfileId('');
    setTransferNotes('');
    loadData();
  };

  // Handle Return
  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnMessage(null);

    if (!returnAssetId) {
      setReturnMessage({ type: 'error', text: 'Please select an asset to return.' });
      return;
    }

    const allAllocations = localDb.getAllocations();
    const activeAlloc = allAllocations.find(al => al.asset_id === returnAssetId && al.status === 'active');
    
    if (!activeAlloc) {
      setReturnMessage({ type: 'error', text: 'No active allocation found for this asset.' });
      return;
    }

    // Update active allocation
    const updatedAllocations = allAllocations.map(al => 
      al.id === activeAlloc.id 
        ? { ...al, status: 'returned' as const, returned_at: new Date().toISOString(), condition_returned: returnCondition, notes: returnNotes.trim() } 
        : al
    );
    localDb.saveAllocations(updatedAllocations);

    // Update asset
    const allAssets = localDb.getAssets();
    const updatedAssets = allAssets.map(a => 
      a.id === returnAssetId 
        ? { ...a, status: 'available' as const, condition: returnCondition } 
        : a
    );
    localDb.saveAssets(updatedAssets);

    const targetAsset = assets.find(a => a.id === returnAssetId);
    const holder = profiles.find(p => p.id === activeAlloc.profile_id);

    // Log Activity
    logActivity({
      actorId: currentUser.id,
      action: 'asset_returned',
      entityType: 'asset',
      entityId: returnAssetId,
      details: {
        asset_tag: targetAsset?.tag,
        asset_name: targetAsset?.name,
        returned_by: holder?.name,
        condition: returnCondition
      },
      notifyUserId: activeAlloc.profile_id,
      notifyMessage: `Your return of asset ${targetAsset?.tag} has been processed. Condition: ${returnCondition}.`,
      notifyType: 'return'
    });

    setReturnMessage({ type: 'success', text: `Return processed. Asset is now Available!` });
    setReturnAssetId('');
    setReturnNotes('');
    loadData();
  };

  // Process Transfer Approvals (Approve / Reject)
  const handleTransferApproval = (transferId: string, isApproved: boolean) => {
    const allTransfers = localDb.getTransfers();
    const transfer = allTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    // Update transfer status
    const updatedTransfers = allTransfers.map(t => 
      t.id === transferId 
        ? { ...t, status: (isApproved ? 'approved' : 'rejected') as any, approved_at: new Date().toISOString() } 
        : t
    );
    localDb.saveTransfers(updatedTransfers);

    const asset = assets.find(a => a.id === transfer.asset_id);
    const sender = profiles.find(p => p.id === transfer.from_profile_id);
    const recipient = profiles.find(p => p.id === transfer.to_profile_id);

    if (isApproved) {
      // 1. Close current active allocation
      const allAllocations = localDb.getAllocations();
      const updatedAllocations = allAllocations.map(al => 
        (al.asset_id === transfer.asset_id && al.status === 'active')
          ? { ...al, status: 'returned' as const, returned_at: new Date().toISOString(), notes: 'Closed due to transfer' }
          : al
      );

      // 2. Create new allocation for receiver
      const newAllocation: Allocation = {
        id: 'alloc-' + Math.random().toString(36).substring(2, 11),
        asset_id: transfer.asset_id,
        profile_id: transfer.to_profile_id,
        status: 'active',
        allocated_at: new Date().toISOString(),
        notes: `Transferred from ${sender?.name || 'Previous Holder'}`,
        created_at: new Date().toISOString()
      };

      localDb.saveAllocations([...updatedAllocations, newAllocation]);

      // 3. Log Activity
      logActivity({
        actorId: currentUser.id,
        action: 'transfer_approved',
        entityType: 'asset',
        entityId: transfer.asset_id,
        details: {
          asset_tag: asset?.tag,
          from: sender?.name,
          to: recipient?.name
        },
        notifyUserId: transfer.to_profile_id,
        notifyMessage: `Transfer approved! Asset ${asset?.tag} is now allocated to you.`,
        notifyType: 'transfer'
      });

      // Notify sender as well
      logActivity({
        actorId: currentUser.id,
        action: 'transfer_notify_sender',
        entityType: 'asset',
        entityId: transfer.asset_id,
        notifyUserId: transfer.from_profile_id,
        notifyMessage: `Asset ${asset?.tag} has been transferred from your account to ${recipient?.name}.`
      });
    } else {
      // Reject Flow
      logActivity({
        actorId: currentUser.id,
        action: 'transfer_rejected',
        entityType: 'transfer_request',
        entityId: transferId,
        details: { asset_tag: asset?.tag },
        notifyUserId: transfer.from_profile_id,
        notifyMessage: `Transfer request for ${asset?.tag} to ${recipient?.name} was rejected.`,
        notifyType: 'transfer'
      });
    }

    loadData();
  };

  // Helper mappings
  const getProfileName = (id: string) => profiles.find(p => p.id === id)?.name || 'Unknown';
  const getProfileDept = (id: string) => {
    const p = profiles.find(p => p.id === id);
    if (!p || !p.department_id) return 'Central';
    return localDb.getDepartments().find(d => d.id === p.department_id)?.name || 'Central';
  };
  const getAssetTagAndName = (id: string) => {
    const a = assets.find(a => a.id === id);
    return a ? `${a.tag} — ${a.name}` : 'Unknown Asset';
  };

  const isApprover = currentUser.role === 'admin' || currentUser.role === 'asset_manager' || currentUser.role === 'department_head';

  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const pastTransfers = transfers.filter(t => t.status !== 'pending');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Allocations & Transfers</h2>
        <p className="text-sm text-slate-400 mt-1">Assign hardware to employees, process equipment returns, and review ownership transfer approvals.</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('allocate')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
            activeSubTab === 'allocate' 
              ? 'border-brand-500 text-brand-400 bg-brand-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="h-4.5 w-4.5" />
          Allocate & Return Hub
        </button>
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeSubTab === 'transfers' 
              ? 'border-brand-500 text-brand-400 bg-brand-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="h-4.5 w-4.5" />
          Transfer Approvals
          {pendingTransfers.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
              {pendingTransfers.length}
            </span>
          )}
        </button>
      </div>

      {/* Grid Sub-content */}
      {activeSubTab === 'allocate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. ALLOCATION / TRANSFER FORM PANEL */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Allocate Asset Node</h3>
                <p className="text-xs text-slate-500">Assign an available asset directly, or request a transfer for allocated assets.</p>
              </div>
            </div>

            {allocationMessage && (
              <div className={`p-4 rounded-xl border text-xs flex gap-2.5 items-start ${
                allocationMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : allocationMessage.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <Info className="h-5 w-5 shrink-0" />
                <span>{allocationMessage.text}</span>
              </div>
            )}

            <form onSubmit={activeAllocation ? handleRequestTransfer : handleAllocate} className="space-y-4">
              {/* Asset Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Select Asset Node</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.tag} &mdash; {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Assignee Employee</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getProfileDept(p.id)} - {p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Return Date (Only shown if normal allocation) */}
              {!activeAllocation && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Expected Return Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {!activeAllocation ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Allocation Purpose / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter details about why this asset is allocated..."
                    value={allocationNotes}
                    onChange={(e) => setAllocationNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-indigo-950/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ArrowRightLeft className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold uppercase">Submit Transfer Request Instead</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Because this asset is already held by <strong>{allocationHolder?.name}</strong>, a transfer workflow is required. Approving the request will seamlessly re-route the asset.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Transfer Reason / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Explain the urgency/reason for this direct owner transfer..."
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3">
                {activeAllocation ? (
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow shadow-indigo-600/10"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                    Request Transfer
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow shadow-brand-600/10"
                  >
                    <UserCheck className="h-5 w-5" />
                    Allocate Asset Node
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 2. RETURN ASSET WORKFLOW PANEL */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-slate-800/80 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Equipment Return Portal</h3>
                <p className="text-xs text-slate-500">Deallocate active assets and verify their physical health condition.</p>
              </div>
            </div>

            {returnMessage && (
              <div className={`p-4 rounded-xl border text-xs flex gap-2.5 items-start ${
                returnMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <Info className="h-5 w-5 shrink-0" />
                <span>{returnMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleReturn} className="space-y-4">
              {/* Asset Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Select Allocated Asset</label>
                <select
                  value={returnAssetId}
                  onChange={(e) => setReturnAssetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Asset to Return --</option>
                  {assets.filter(a => a.status === 'allocated').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.tag} &mdash; {a.name} ({getProfileName(allocations.find(al => al.asset_id === a.id && al.status === 'active')?.profile_id || '')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Return Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Returned Physical Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as AssetCondition)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="Excellent">Excellent (Like New)</option>
                  <option value="Good">Good (Minor wear)</option>
                  <option value="Fair">Fair (Scratches/Marks)</option>
                  <option value="Poor">Poor (Major defects)</option>
                  <option value="Damaged">Damaged (Needs repair)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Condition Notes / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Note down screen cracks, scratch details, missing items, etc..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-all shadow shadow-amber-600/10"
                >
                  <RotateCcw className="h-5 w-5" />
                  Process Asset Return
                </button>
              </div>
            </form>
          </div>

        </div>
      ) : (
        <div className="space-y-8">
          
          {/* PENDING APPROVALS LIST */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-indigo-400" />
              Pending Transfer Approvals
            </h3>
            
            {pendingTransfers.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <HelpCircle className="h-8 w-8 text-slate-650 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-400">No pending transfers</h4>
                <p className="text-[10px] text-slate-550 mt-1 max-w-xs mx-auto">All request tickets are fully resolved and updated.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTransfers.map((t) => (
                  <div key={t.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-brand-300 font-bold">
                          {assets.find(a => a.id === t.asset_id)?.tag || 'Asset'}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(t.requested_at || t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-slate-200">
                        {assets.find(a => a.id === t.asset_id)?.name}
                      </h4>

                      <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-slate-950 border border-slate-850">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-semibold">From Holder</p>
                          <p className="font-semibold text-slate-355">{getProfileName(t.from_profile_id || t.from_employee_id || '')}</p>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-slate-600 mx-3" />
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-semibold">Recipient Target</p>
                          <p className="font-semibold text-indigo-300">{getProfileName(t.to_profile_id || t.to_employee_id || '')}</p>
                        </div>
                      </div>

                      {t.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/20 p-2.5 rounded border border-slate-900">
                          &ldquo;{t.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-850">
                      {isApprover ? (
                        <>
                          <button
                            onClick={() => handleTransferApproval(t.id, false)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 transition-all"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleTransferApproval(t.id, true)}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold text-white transition-all shadow shadow-brand-600/10"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Awaiting Manager Approval</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED / PAST HISTORICAL LOG */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Resolved Transfers Log</h3>
            {pastTransfers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No historical transfer requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 pb-2">
                      <th className="py-2.5">Asset</th>
                      <th className="py-2.5">Origin Holder</th>
                      <th className="py-2.5">Recipient Target</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Resolved Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {pastTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/10">
                        <td className="py-3 font-semibold text-slate-300">
                          {getAssetTagAndName(t.asset_id)}
                        </td>
                        <td className="py-3">{getProfileName(t.from_profile_id || t.from_employee_id || '')}</td>
                        <td className="py-3 text-slate-300">{getProfileName(t.to_profile_id || t.to_employee_id || '')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {t.approved_at ? new Date(t.approved_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
