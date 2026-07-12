import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Laptop, 
  Monitor, 
  Armchair, 
  Car, 
  DoorOpen, 
  History, 
  ArrowRightLeft, 
  UserCheck, 
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Scan,
  Camera,
  X
} from 'lucide-react';
import type { Asset, Profile, Department, Category, AssetStatus, AssetCondition, Allocation, AssetDocument, MaintenanceRequest } from '../../lib/types';
import { localDb } from '../../lib/supabase';
import { logActivity } from '../../lib/activity';

interface AssetDirectoryProps {
  currentUser: Profile;
  onNavigateToAllocations: (preselectedAssetId?: string, actionType?: 'allocate' | 'return' | 'transfer') => void;
}

export default function AssetDirectory({ currentUser, onNavigateToAllocations }: AssetDirectoryProps) {
  // Database States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // New Asset Form States
  const [showRegisterPanel, setShowRegisterPanel] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');
  const [newAssetDept, setNewAssetDept] = useState('');
  const [newAssetCondition, setNewAssetCondition] = useState<AssetCondition>('Good');
  const [newAssetBookable, setNewAssetBookable] = useState(false);
  const [newAssetCost, setNewAssetCost] = useState('');
  const [newAssetAcquisitionDate, setNewAssetAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAssetPhotoUrl, setNewAssetPhotoUrl] = useState('');
  const [newAssetLocation, setNewAssetLocation] = useState('');
  const [newAssetDocs, setNewAssetDocs] = useState<AssetDocument[]>([]);
  const [docNameInput, setDocNameInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');
  const [formError, setFormError] = useState('');

  // Expand Asset Log History
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'timeline' | 'allocations' | 'maintenance'>('timeline');

  // QR Code Scanner Simulator states
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTag, setScannedTag] = useState<string | null>(null);
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);

  // Load Data
  const loadData = () => {
    setAssets(localDb.getAssets());
    setAllocations(localDb.getAllocations());
    setProfiles(localDb.getProfiles());
    setDepartments(localDb.getDepartments());
    setCategories(localDb.getCategories());
    setMaintenanceRequests(localDb.getMaintenanceRequests());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state changes from parent role or actions
  useEffect(() => {
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Compute Stats
  const [stats, setStats] = useState({ total: 0, available: 0, allocated: 0, maintenance: 0, totalValue: 0 });

  useEffect(() => {
    setStats({
      total: assets.length,
      available: assets.filter(a => a.status === 'available').length,
      allocated: assets.filter(a => a.status === 'allocated').length,
      maintenance: assets.filter(a => a.status === 'under_maintenance').length,
      totalValue: assets.reduce((sum, a) => sum + (a.acquisition_cost || 0), 0)
    });
  }, [assets]);

  // Handle Register Asset
  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newAssetName.trim()) {
      setFormError('Asset name is required.');
      return;
    }
    if (!newAssetCategory) {
      setFormError('Asset category is required.');
      return;
    }

    const allAssets = localDb.getAssets();
    
    // Auto-generate tag based on finding the highest existing tag index starting with AF-
    let nextSeq = 1;
    allAssets.forEach(a => {
      if (a.tag && a.tag.startsWith('AF-')) {
        const numPart = parseInt(a.tag.substring(3), 10);
        if (!isNaN(numPart) && numPart >= nextSeq) {
          nextSeq = numPart + 1;
        }
      }
    });
    const nextTag = `AF-${String(nextSeq).padStart(4, '0')}`;

    const newAsset: Asset = {
      id: 'ast-' + Math.random().toString(36).substring(2, 11),
      tag: nextTag,
      name: newAssetName.trim(),
      serial_number: newAssetSerial.trim() || null,
      category_id: newAssetCategory,
      department_id: newAssetDept || null,
      status: 'available',
      is_bookable: newAssetBookable,
      condition: newAssetCondition,
      acquisition_cost: newAssetCost ? parseFloat(newAssetCost) : null,
      acquisition_date: newAssetAcquisitionDate || null,
      photo_url: newAssetPhotoUrl.trim() || null,
      image_url: newAssetPhotoUrl.trim() || undefined,
      location: newAssetLocation.trim() || null,
      documents: newAssetDocs.length > 0 ? newAssetDocs : null,
      created_at: new Date().toISOString()
    };

    // Save
    const updatedAssets = [...allAssets, newAsset];
    localDb.saveAssets(updatedAssets);
    setAssets(updatedAssets);

    // Log Activity
    logActivity({
      actorId: currentUser.id,
      action: 'asset_registered',
      entityType: 'asset',
      entityId: newAsset.id,
      details: {
        asset_tag: newAsset.tag,
        asset_name: newAsset.name,
        category: categories.find(c => c.id === newAsset.category_id)?.name || 'Unknown',
        cost: newAsset.acquisition_cost,
        location: newAsset.location
      }
    });

    // Reset Form
    setNewAssetName('');
    setNewAssetSerial('');
    setNewAssetCategory('');
    setNewAssetDept('');
    setNewAssetCondition('Good');
    setNewAssetBookable(false);
    setNewAssetCost('');
    setNewAssetAcquisitionDate(new Date().toISOString().split('T')[0]);
    setNewAssetPhotoUrl('');
    setNewAssetLocation('');
    setNewAssetDocs([]);
    setDocNameInput('');
    setDocUrlInput('');
    setShowRegisterPanel(false);
    loadData();
  };

  const handleSimulateScan = () => {
    if (assets.length === 0) return;
    setShowScannerModal(true);
    setIsScanning(true);
    setScannedTag(null);

    setTimeout(() => {
      setIsScanning(false);
      const randomAsset = assets[Math.floor(Math.random() * assets.length)];
      setScannedTag(randomAsset.tag);
      setSearchQuery(randomAsset.tag);
      setHighlightedAssetId(randomAsset.id);
      
      setTimeout(() => {
        setShowScannerModal(false);
        setScannedTag(null);
        setTimeout(() => {
          setHighlightedAssetId(null);
        }, 3000);
      }, 1550);

    }, 2000);
  };

  const handleStatusChange = (assetId: string, newStatus: AssetStatus) => {
    const allAssets = localDb.getAssets();
    const asset = allAssets.find(a => a.id === assetId);
    if (!asset) return;

    const oldStatus = asset.status;
    const updatedAssets = allAssets.map(a => 
      a.id === assetId ? { ...a, status: newStatus } : a
    );
    localDb.saveAssets(updatedAssets);

    // Log Activity
    logActivity({
      actorId: currentUser.id,
      action: 'status_transition',
      entityType: 'asset',
      entityId: assetId,
      details: {
        asset_tag: asset.tag,
        asset_name: asset.name,
        from_status: oldStatus,
        to_status: newStatus
      },
      notifyUserId: currentUser.id,
      notifyMessage: `Asset status manually changed from '${oldStatus}' to '${newStatus}' for ${asset.tag}.`,
      notifyType: 'audit'
    });

    loadData();
  };

  // Expand Asset History
  const toggleHistory = (asset: Asset) => {
    if (expandedAssetId === asset.id) {
      setExpandedAssetId(null);
    } else {
      setExpandedAssetId(asset.id);
      // Fetch activity logs linked to this asset ID
      const logs = localDb.getActivityLogs()
        .filter(log => log.entity_id === asset.id || (log.details && log.details.asset_tag === asset.tag));
      setAssetHistory(logs);
    }
  };

  // Quick Action triggers
  const handleAllocateClick = (assetId: string) => {
    onNavigateToAllocations(assetId, 'allocate');
  };

  const handleReturnClick = (assetId: string) => {
    onNavigateToAllocations(assetId, 'return');
  };

  const handleTransferClick = (assetId: string) => {
    onNavigateToAllocations(assetId, 'transfer');
  };

  // Filters calculation
  const filteredAssets = assets.filter((asset) => {
    const categoryMatch = !selectedCategory || asset.category_id === selectedCategory;
    const departmentMatch = !selectedDepartment || asset.department_id === selectedDepartment;
    const statusMatch = !selectedStatus || asset.status === selectedStatus;
    const locationMatch = !selectedLocation || (asset.location && asset.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    const searchLower = searchQuery.toLowerCase();
    const catName = categories.find(c => c.id === asset.category_id)?.name || '';
    const deptName = departments.find(d => d.id === asset.department_id)?.name || '';
    const statusText = asset.status.replace('_', ' ');

    const searchMatch = !searchQuery || 
      asset.name.toLowerCase().includes(searchLower) ||
      asset.tag.toLowerCase().includes(searchLower) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchLower)) ||
      (asset.location && asset.location.toLowerCase().includes(searchLower)) ||
      catName.toLowerCase().includes(searchLower) ||
      deptName.toLowerCase().includes(searchLower) ||
      statusText.toLowerCase().includes(searchLower) ||
      asset.status.toLowerCase().includes(searchLower);

    return categoryMatch && departmentMatch && statusMatch && locationMatch && searchMatch;
  });

  // Style helper mapping for asset categories
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop')) return Laptop;
    if (name.includes('monitor')) return Monitor;
    if (name.includes('chair') || name.includes('furniture')) return Armchair;
    if (name.includes('vehicle') || name.includes('car') || name.includes('van')) return Car;
    return DoorOpen;
  };

  // Badge stylings
  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>;
      case 'allocated':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Allocated</span>;
      case 'reserved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Reserved</span>;
      case 'under_maintenance':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Maintenance</span>;
      case 'lost':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Lost</span>;
      case 'retired':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Retired</span>;
      case 'disposed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Disposed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const getConditionBadge = (condition: AssetCondition) => {
    switch (condition) {
      case 'Excellent':
      case 'Good':
        return <span className="text-slate-300 bg-slate-900 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">{condition}</span>;
      case 'Fair':
        return <span className="text-amber-400 bg-amber-950/20 border border-amber-900/30 text-[10px] font-bold px-2 py-0.5 rounded">{condition}</span>;
      default:
        return <span className="text-rose-400 bg-rose-950/20 border border-rose-900/30 text-[10px] font-bold px-2 py-0.5 rounded">{condition}</span>;
    }
  };

  // Find allocation holder
  const getAllocatedUser = (assetId: string) => {
    const activeAlloc = allocations.find(al => al.asset_id === assetId && al.status === 'active');
    if (!activeAlloc) return null;
    const profile = profiles.find(p => p.id === activeAlloc.profile_id);
    return profile ? profile.name : 'Unknown Employee';
  };

  const isAssetManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'asset_manager';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Asset Registry</h2>
          <p className="text-sm text-slate-400 mt-1">Register enterprise hardware, search tags, track active lifecycles, and view logs.</p>
        </div>

        {isAssetManagerOrAdmin && (
          <button
            onClick={() => setShowRegisterPanel(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/15"
          >
            <Plus className="h-5 w-5" />
            Register New Asset
          </button>
        )}
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: 'Total Assets', value: stats.total, color: 'border-slate-800 text-white bg-slate-900/40' },
          { label: 'Available', value: stats.available, color: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/10' },
          { label: 'Allocated', value: stats.allocated, color: 'border-indigo-500/20 text-indigo-400 bg-indigo-950/10' },
          { label: 'Under Repair', value: stats.maintenance, color: 'border-amber-500/20 text-amber-400 bg-amber-950/10' },
          { label: 'Portfolio Value', value: `₹${stats.totalValue.toLocaleString()}`, color: 'border-violet-500/20 text-violet-400 bg-violet-950/10' }
        ].map((c, i) => (
          <div key={i} className={`p-5 rounded-2xl border glass-card ${c.color} shadow-sm`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Register Asset Drawer Panel */}
      {showRegisterPanel && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 animate-slide-up relative">
            <h3 className="text-xl font-bold text-white mb-4">Register Asset Node</h3>
            
            <form onSubmit={handleRegisterAsset} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 7420, Conference Room A"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-892120-J"
                    value={newAssetSerial}
                    onChange={(e) => setNewAssetSerial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Condition</label>
                  <select
                    value={newAssetCondition}
                    onChange={(e) => setNewAssetCondition(e.target.value as AssetCondition)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Category *</label>
                  <select
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Department Assignment</label>
                  <select
                    value={newAssetDept}
                    onChange={(e) => setNewAssetDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="">-- Unassigned / Central --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Acquisition Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1200.00"
                    value={newAssetCost}
                    onChange={(e) => setNewAssetCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Acquisition Date</label>
                  <input
                    type="date"
                    value={newAssetAcquisitionDate}
                    onChange={(e) => setNewAssetAcquisitionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Location / Room *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Headquarters, Room 204"
                    value={newAssetLocation}
                    onChange={(e) => setNewAssetLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Asset Image URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=120"
                    value={newAssetPhotoUrl}
                    onChange={(e) => setNewAssetPhotoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {/* Documents & Manuals section */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Documents & Manuals</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Document Name (e.g. Warranty doc)"
                    value={docNameInput}
                    onChange={(e) => setDocNameInput(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com/manual.pdf"
                    value={docUrlInput}
                    onChange={(e) => setDocUrlInput(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!docNameInput.trim() || !docUrlInput.trim()) return;
                      setNewAssetDocs([...newAssetDocs, { name: docNameInput.trim(), url: docUrlInput.trim() }]);
                      setDocNameInput('');
                      setDocUrlInput('');
                    }}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-750 text-xs font-bold text-brand-400 hover:text-white rounded-xl transition-all"
                  >
                    Add
                  </button>
                </div>
                
                {newAssetDocs.length > 0 && (
                  <div className="mt-2 p-2 bg-slate-950/50 border border-slate-850 rounded-xl max-h-24 overflow-y-auto space-y-1">
                    {newAssetDocs.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between text-[11px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                        <span className="text-slate-300 font-medium truncate max-w-[160px]" title={doc.name}>
                          {doc.name}
                        </span>
                        <span className="text-slate-550 truncate max-w-[160px] font-mono text-[10px]" title={doc.url}>
                          {doc.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewAssetDocs(newAssetDocs.filter((_, i) => i !== index))}
                          className="text-rose-450 hover:text-rose-350 hover:bg-rose-500/10 h-5 w-5 flex items-center justify-center rounded transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newAssetBookable}
                    onChange={(e) => setNewAssetBookable(e.target.checked)}
                    className="h-4.5 w-4.5 rounded bg-slate-950 border-slate-800 text-brand-600 focus:ring-brand-500/20"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Shared Resource (Bookable)</span>
                    <p className="text-[10px] text-slate-500">Allows employees to reserve timeslots on this asset (e.g. vans, conference rooms).</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowRegisterPanel(false)}
                  className="px-4.5 py-2 rounded-xl border border-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition-colors shadow shadow-brand-600/10"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Filter / Controls */}
      <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Text Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Tag ID, Asset Name, or Serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateScan}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer animate-pulse"
              title="Scan Tag QR Code"
            >
              <QrCode className="h-4 w-4 text-brand-400" />
              Scan QR
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all ${
                showFilters || selectedCategory || selectedDepartment || selectedStatus || selectedLocation
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-300' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              {(selectedCategory || selectedDepartment || selectedStatus || selectedLocation) && (
                <span className="h-2 w-2 rounded-full bg-brand-400" />
              )}
            </button>

            {(searchQuery || selectedCategory || selectedDepartment || selectedStatus || selectedLocation) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedDepartment('');
                  setSelectedStatus('');
                  setSelectedLocation('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-300 px-2.5 py-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Expandable Advanced Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-850 animate-slide-down">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Filter by Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Filter by Lifecycle Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="allocated">Allocated</option>
                <option value="reserved">Reserved</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="lost">Lost</option>
                <option value="retired">Retired</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Filter by Location</label>
              <input
                type="text"
                placeholder="e.g. Floor 2, HQ"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Directory Table / List */}
      <div className="glass border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {filteredAssets.length === 0 ? (
          <div className="py-16 text-center">
            <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-300">No assets found</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">Try refining your search text or removing filters to locate registered equipment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="px-6 py-4.5">Asset Tag</th>
                  <th className="px-6 py-4.5">Item Name</th>
                  <th className="px-6 py-4.5">Category</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Condition</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAssets.map((asset) => {
                  const CatIcon = getCategoryIcon(
                    categories.find(c => c.id === asset.category_id)?.name || ''
                  );
                  const isExpanded = expandedAssetId === asset.id;
                  const isHighlighted = highlightedAssetId === asset.id;

                  return (
                    <React.Fragment key={asset.id}>
                      <tr 
                        className={`group border-b border-slate-850 hover:bg-slate-900/10 cursor-pointer transition-all duration-500 ${
                          isHighlighted ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500 z-50 relative' : ''
                        }`}
                      >
                        {/* Tag */}
                        <td className="px-6 py-4.5 font-mono text-xs font-bold">
                          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-850 text-brand-300 group-hover:border-brand-500/20 transition-colors">
                            {asset.tag}
                          </span>
                        </td>
                        
                        {/* Name / SN */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8.5 w-8.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {asset.photo_url || asset.image_url ? (
                                <img 
                                  src={asset.photo_url || asset.image_url} 
                                  alt={asset.name} 
                                  className="h-full w-full object-cover" 
                                  onError={(e) => {
                                    (e.target as any).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <CatIcon className="h-4.5 w-4.5 text-slate-400 group-hover:text-brand-300 transition-colors" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold block truncate text-slate-200 group-hover:text-white transition-colors">{asset.name}</span>
                              {asset.serial_number && (
                                <span className="text-[10px] text-slate-500 font-mono tracking-tight">SN: {asset.serial_number}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4.5 text-xs text-slate-400">
                          {categories.find(c => c.id === asset.category_id)?.name || 'Unknown'}
                        </td>

                        {/* Dept */}
                        <td className="px-6 py-4.5 text-xs text-slate-400">
                          {departments.find(d => d.id === asset.department_id)?.name || (
                            <span className="text-slate-600 font-medium">Unassigned</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4.5">
                          <div>
                            {getStatusBadge(asset.status)}
                            {asset.status === 'allocated' && (
                              <p className="text-[10px] text-slate-500 font-medium mt-1">
                                Held by: <span className="text-slate-400">{getAllocatedUser(asset.id)}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Condition */}
                        <td className="px-6 py-4.5">
                          {getConditionBadge(asset.condition)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Expand History Logs */}
                            <button
                              onClick={() => toggleHistory(asset)}
                              title="Audit Trail"
                              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                                isExpanded 
                                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <History className="h-4.5 w-4.5" />
                            </button>

                            {/* Lifecycle State Modifiers */}
                            {asset.status === 'available' && isAssetManagerOrAdmin && (
                              <button
                                onClick={() => handleAllocateClick(asset.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                                Allocate
                              </button>
                            )}

                            {asset.status === 'allocated' && (
                              <>
                                <button
                                  onClick={() => handleTransferClick(asset.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-400" />
                                  Transfer
                                </button>
                                {isAssetManagerOrAdmin && (
                                  <button
                                    onClick={() => handleReturnClick(asset.id)}
                                    className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                                    Return
                                  </button>
                                )}
                              </>
                            )}

                            {/* Manual lifecycle status transition dropdown for admins/managers */}
                            {isAssetManagerOrAdmin && asset.status !== 'allocated' && asset.status !== 'under_maintenance' && (
                              <select
                                value={asset.status}
                                onChange={(e) => handleStatusChange(asset.id, e.target.value as any)}
                                className="px-2 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-bold focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
                              >
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="lost">Lost</option>
                                <option value="retired">Retired</option>
                                <option value="disposed">Disposed</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded History Log row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-slate-950 px-6 py-5 border-t border-b border-slate-850">
                            <div className="flex flex-col md:flex-row gap-6 animate-slide-down">
                                                          {/* Left Panel: QR Code and Node Details */}
                              <div className="w-full md:w-60 bg-slate-900 border border-slate-800/80 rounded-xl p-4.5 flex flex-col items-center justify-center space-y-4 shadow-inner shrink-0 text-center">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  Asset Tag QR Code
                                </h5>
                                <div className="p-2.5 bg-white rounded-lg shadow-md hover:scale-102 transition-transform duration-200">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${asset.tag}`} 
                                    alt={`QR Code for ${asset.tag}`}
                                    className="w-28 h-28"
                                    onError={(e) => {
                                      // fallback placeholder if offline
                                      (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2050/svg" width="100" height="100"><rect width="100" height="100" fill="gray"/></svg>';
                                    }}
                                  />
                                </div>
                                <div className="space-y-1 w-full">
                                  <span className="text-xs font-mono font-extrabold text-brand-300 px-2 py-0.5 rounded bg-slate-950 border border-slate-850">
                                    {asset.tag}
                                  </span>
                                  {asset.acquisition_cost !== undefined && asset.acquisition_cost !== null && (
                                    <p className="text-[11px] text-slate-400 font-semibold pt-1">
                                      Cost: <span className="text-emerald-400">₹{asset.acquisition_cost.toLocaleString()}</span>
                                    </p>
                                  )}
                                  {asset.acquisition_date && (
                                    <p className="text-[10px] text-slate-500">
                                      Acquired: {new Date(asset.acquisition_date).toLocaleDateString()}
                                    </p>
                                  )}
                                  {asset.location && (
                                    <p className="text-[10px] text-slate-400 font-medium pt-1 pb-1">
                                      Location: <span className="text-slate-300 font-semibold">{asset.location}</span>
                                    </p>
                                  )}
                                  
                                  {asset.documents && asset.documents.length > 0 && (
                                    <div className="pt-2 text-left w-full border-t border-slate-800/80 space-y-1.5">
                                      <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center md:text-left">
                                        Documents
                                      </h6>
                                      <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {asset.documents.map((doc, idx) => (
                                          <a 
                                            key={idx}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-[11px] text-brand-400 hover:text-brand-300 hover:underline truncate text-center md:text-left font-medium"
                                            title={doc.name}
                                          >
                                            📄 {doc.name}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Panel: Tabbed history */}
                              <div className="flex-1 text-left space-y-4 min-w-0">
                                <div className="flex border-b border-slate-800/80">
                                  {[
                                    { id: 'timeline', label: 'Timeline & Audit' },
                                    { id: 'allocations', label: 'Allocation History' },
                                    { id: 'maintenance', label: 'Maintenance History' }
                                  ].map(tab => (
                                    <button
                                      key={tab.id}
                                      onClick={() => setActiveHistoryTab(tab.id as any)}
                                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                        activeHistoryTab === tab.id
                                          ? 'border-brand-500 text-brand-400 font-extrabold'
                                          : 'border-transparent text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      {tab.label}
                                    </button>
                                  ))}
                                </div>

                                {activeHistoryTab === 'timeline' && (
                                  <div className="space-y-3.5 animate-fade-in">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
                                      <History className="h-4 w-4" />
                                      Asset Node Audit Trail
                                    </h4>
                                    
                                    {assetHistory.length === 0 ? (
                                      <p className="text-xs text-slate-500 italic">No logs reported for this device.</p>
                                    ) : (
                                      <div className="relative pl-7 border-l-2 border-slate-800/80 space-y-5 max-h-60 overflow-y-auto py-1">
                                        {assetHistory.map((log) => {
                                          const actorName = profiles.find(p => p.id === log.actor_id)?.name || 'System';
                                          const getTimelineStyle = (action: string) => {
                                            switch (action) {
                                              case 'asset_registered':
                                                return { icon: <Plus className="h-3 w-3" />, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
                                              case 'asset_allocated':
                                                return { icon: <UserCheck className="h-3 w-3" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
                                              case 'asset_returned':
                                                return { icon: <RotateCcw className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
                                              case 'status_transition':
                                                return { icon: <HelpCircle className="h-3 w-3" />, color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
                                              default:
                                                return { icon: <ArrowRightLeft className="h-3 w-3" />, color: 'bg-slate-800 text-slate-400 border-slate-700/50' };
                                            }
                                          };
                                          const style = getTimelineStyle(log.action);
                                          return (
                                            <div key={log.id} className="text-xs relative">
                                              <span className={`absolute -left-[38px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center border ${style.color} ring-4 ring-slate-950 z-10 hover:scale-110 transition-transform`}>
                                                {style.icon}
                                              </span>
                                              <div className="flex items-center justify-between text-slate-400 mb-0.5">
                                                <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                                                  {log.action.split('_').join(' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-550 font-mono">
                                                  {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                              </div>
                                              <p className="text-slate-400 leading-relaxed">
                                                Triggered by <span className="text-slate-300 font-medium">{actorName}</span>
                                                {log.details && log.details.assignee && <> &rarr; Assigned to <span className="text-brand-300 font-bold">{log.details.assignee}</span></>}
                                                {log.details && log.details.to_status && <> &rarr; Transitioned to <span className="text-violet-300 font-semibold">{log.details.to_status.toUpperCase()}</span></>}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {activeHistoryTab === 'allocations' && (
                                  <div className="space-y-3 animate-fade-in">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
                                      <UserCheck className="h-4 w-4" />
                                      Allocation History
                                    </h4>
                                    
                                    {(() => {
                                      const assetAllocations = allocations.filter(al => al.asset_id === asset.id);
                                      if (assetAllocations.length === 0) {
                                        return <p className="text-xs text-slate-500 italic">No allocation logs registered for this asset.</p>;
                                      }
                                      return (
                                        <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40 max-h-60 overflow-y-auto">
                                          <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                              <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                                                <th className="px-4 py-2.5">Assignee</th>
                                                <th className="px-4 py-2.5">Date Allocated</th>
                                                <th className="px-4 py-2.5">Expected Return</th>
                                                <th className="px-4 py-2.5">Actual Return</th>
                                                <th className="px-4 py-2.5">Status</th>
                                                <th className="px-4 py-2.5">Notes</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850/60">
                                              {assetAllocations.map(al => {
                                                const assignee = profiles.find(p => p.id === al.employee_id || p.id === al.profile_id);
                                                const assigneeName = assignee ? assignee.name : 'Central / Unassigned';
                                                
                                                const getAllocStatusBadge = (status: string) => {
                                                  switch (status) {
                                                    case 'active':
                                                      return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Active</span>;
                                                    case 'returned':
                                                      return <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-bold">Returned</span>;
                                                    case 'overdue':
                                                      return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold">Overdue</span>;
                                                    default:
                                                      return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">{status}</span>;
                                                  }
                                                };

                                                return (
                                                  <tr key={al.id} className="hover:bg-slate-900/40">
                                                    <td className="px-4 py-2 font-medium text-slate-200">{assigneeName}</td>
                                                    <td className="px-4 py-2 text-slate-400">{al.allocated_at ? new Date(al.allocated_at).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-4 py-2 text-slate-400">{al.expected_return_date || al.expected_return_at || 'N/A'}</td>
                                                    <td className="px-4 py-2 text-slate-400">{al.returned_at ? new Date(al.returned_at).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-4 py-2">{getAllocStatusBadge(al.status)}</td>
                                                    <td className="px-4 py-2 text-slate-400 max-w-[150px] truncate" title={al.notes || al.return_condition_notes || ''}>
                                                      {al.notes || al.return_condition_notes || <span className="text-slate-650 font-mono">-</span>}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                {activeHistoryTab === 'maintenance' && (
                                  <div className="space-y-3 animate-fade-in">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4" />
                                      Maintenance Logs
                                    </h4>
                                    
                                    {(() => {
                                      const assetMaintenance = maintenanceRequests.filter(mr => mr.asset_id === asset.id);
                                      if (assetMaintenance.length === 0) {
                                        return <p className="text-xs text-slate-500 italic">No maintenance logs registered for this asset.</p>;
                                      }
                                      return (
                                        <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-955/40 max-h-60 overflow-y-auto">
                                          <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                              <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                                                <th className="px-4 py-2.5">Issue Description</th>
                                                <th className="px-4 py-2.5">Priority</th>
                                                <th className="px-4 py-2.5">Status</th>
                                                <th className="px-4 py-2.5">Technician</th>
                                                <th className="px-4 py-2.5">Date Logged</th>
                                                <th className="px-4 py-2.5">Date Resolved</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850/60">
                                              {assetMaintenance.map(mr => {
                                                const getPriorityBadge = (prio: string) => {
                                                  switch (prio) {
                                                    case 'low':
                                                      return <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">Low</span>;
                                                    case 'medium':
                                                      return <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">Med</span>;
                                                    case 'high':
                                                      return <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-450 border border-rose-500/20 text-[9px] font-bold">High</span>;
                                                    case 'critical':
                                                      return <span className="px-1.5 py-0.5 rounded bg-rose-600/20 text-rose-300 border border-rose-600/30 text-[9px] font-bold animate-pulse">Critical</span>;
                                                    default:
                                                      return <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 text-[9px] font-bold">{prio}</span>;
                                                  }
                                                };
                                                
                                                const getMaintStatusBadge = (status: string) => {
                                                  switch (status) {
                                                    case 'pending':
                                                      return <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-bold">Pending</span>;
                                                    case 'approved':
                                                    case 'assigned':
                                                      return <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold">Assigned</span>;
                                                    case 'in_progress':
                                                      return <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-450 border border-indigo-500/20 text-[9px] font-bold">In Progress</span>;
                                                    case 'resolved':
                                                      return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Resolved</span>;
                                                    case 'rejected':
                                                      return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold">Rejected</span>;
                                                    default:
                                                      return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">{status}</span>;
                                                  }
                                                };

                                                return (
                                                  <tr key={mr.id} className="hover:bg-slate-900/40">
                                                    <td className="px-4 py-2 font-medium text-slate-200 max-w-[180px] truncate" title={mr.issue_description || mr.details || ''}>
                                                      {mr.issue_description || mr.details || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2">{getPriorityBadge(mr.priority)}</td>
                                                    <td className="px-4 py-2">{getMaintStatusBadge(mr.status)}</td>
                                                    <td className="px-4 py-2 text-slate-400 font-medium">{mr.technician_name || <span className="text-slate-600 font-mono">Unassigned</span>}</td>
                                                    <td className="px-4 py-2 text-slate-400">{mr.created_at ? new Date(mr.created_at).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-4 py-2 text-slate-400">{mr.resolved_at ? new Date(mr.resolved_at).toLocaleDateString() : <span className="text-slate-650 italic">Active</span>}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* QR Code Scanner Simulation Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 text-center space-y-6">
              <div className="flex flex-col items-center">
                <Camera className="h-8 w-8 text-indigo-400 animate-pulse" />
                <h4 className="text-md font-bold text-white mt-3">QR Code Tag Reader</h4>
                <p className="text-xs text-slate-500 mt-1">Simulating hardware laser barcode camera scans...</p>
              </div>

              {/* Viewfinder window */}
              <div className="relative w-48 h-48 mx-auto border-2 border-indigo-500 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Visual Laser bar */}
                {isScanning && (
                  <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-bounce shadow-[0_0_10px_rgba(34,211,238,0.7)]" style={{ animationDuration: '2s' }} />
                )}

                {isScanning ? (
                  <div className="text-center space-y-2">
                    <Scan className="h-8 w-8 text-cyan-400 animate-pulse mx-auto" />
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">SCANNING TAG NODE...</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2 animate-scale-up">
                    <QrCode className="h-12 w-12 text-emerald-400 mx-auto" />
                    <span className="text-[11px] text-emerald-400 font-mono font-bold block">{scannedTag}</span>
                    <span className="text-[9px] text-emerald-500 tracking-wider font-extrabold uppercase">TAG SCANNED SUCCESS</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 italic">
                {isScanning ? "Aiming at tag barcode sequence..." : "Verifying Odoo ERP database matches..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
