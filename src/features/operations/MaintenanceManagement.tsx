import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { Asset, MaintenanceRequest, Profile } from '../../lib/types';
import { getAssets, getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceStatus } from './operationsApi';
import { Wrench, Plus, User, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, X, History } from 'lucide-react';

const STATUS_COLUMNS = [
  { id: 'pending', title: 'Pending Approval', color: 'border-amber-500/20 bg-amber-550/5', dot: 'bg-amber-500' },
  { id: 'approved', title: 'Approved', color: 'border-sky-500/20 bg-sky-550/5', dot: 'bg-sky-400' },
  { id: 'technician_assigned', title: 'Tech Assigned', color: 'border-indigo-500/20 bg-indigo-550/5', dot: 'bg-indigo-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-violet-500/20 bg-violet-550/5', dot: 'bg-violet-500' },
  { id: 'resolved', title: 'Resolved', color: 'border-emerald-500/20 bg-emerald-550/5', dot: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', color: 'border-rose-500/20 bg-rose-550/5', dot: 'bg-rose-500' }
] as const;

export const MaintenanceManagement: React.FC = () => {
  const { profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<(MaintenanceRequest & { asset?: Asset; raiser?: Profile })[]>([]);
  
  // Modals / Inputs
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formAssetId, setFormAssetId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Inspection History tab
  const [historyAssetId, setHistoryAssetId] = useState('');
  
  // Technician Assignment Modal
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [techName, setTechName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const aList = await getAssets();
      setAssets(aList);
      if (aList.length > 0 && !formAssetId) {
        setFormAssetId(aList[0].id);
      }
      
      const rList = await getMaintenanceRequests();
      setRequests(rList);
    } catch (err) {
      console.error("Error loading maintenance data:", err);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for DB updates
    const handleDbChange = () => loadData();
    window.addEventListener('mock-db-change', handleDbChange);
    return () => window.removeEventListener('mock-db-change', handleDbChange);
  }, []);

  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await createMaintenanceRequest(
        formAssetId, 
        profile.id, 
        formDescription, 
        formPriority, 
        formPhoto || formPhotoUrl || null
      );
      setSuccessMessage("Maintenance request submitted successfully!");
      setFormDescription('');
      setFormPhotoUrl('');
      setFormPhoto(null);
      setTimeout(() => {
        setIsNewModalOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: MaintenanceRequest['status']) => {
    if (!profile) return;
    
    // Check role permission
    const isAuthorized = profile.role === 'admin' || profile.role === 'asset_manager';
    if (!isAuthorized) {
      alert("Unauthorized! Only Asset Managers or Admins can modify maintenance status.");
      return;
    }

    try {
      if (status === 'technician_assigned') {
        setAssigningRequestId(id);
        return;
      }

      await updateMaintenanceStatus(id, status, profile.id);
      setSuccessMessage(`Request status updated to ${status}`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update status.");
    }
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !assigningRequestId) return;

    try {
      await updateMaintenanceStatus(assigningRequestId, 'technician_assigned', profile.id, {
        technicianName: techName
      });
      setSuccessMessage("Technician assigned!");
      setTechName('');
      setAssigningRequestId(null);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to assign technician.");
    }
  };

  const canManage = profile?.role === 'admin' || profile?.role === 'asset_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Maintenance Management
          </h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Track asset health, approve repair requests, and assign service technicians.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Raise Maintenance Request
          </button>
        </div>
      </div>

      {/* Role Reminder Alert */}
      {!canManage && (
        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center gap-2.5 text-amber-400 text-xs">
          <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
          <span>You are viewing as an <strong>{profile?.role}</strong>. Only <strong>Asset Managers</strong> or <strong>Admins</strong> can move requests through the repair approval pipelines.</span>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 rounded-xl flex items-center gap-2.5 text-sm">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STATUS_COLUMNS.map((column) => {
          const columnRequests = requests.filter((r) => r.status === column.id);

          return (
            <div
              key={column.id}
              className={`flex flex-col shrink-0 w-[270px] h-[650px] rounded-2xl border p-4 bg-slate-950/20 ${column.color}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-900 mb-4">
                <div className="flex items-start gap-2 pt-0.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${column.dot}`} />
                  <h3 className="font-bold text-sm text-slate-200 leading-snug break-words">{column.title}</h3>
                </div>
                <span className="flex items-center justify-center shrink-0 w-5.5 h-5.5 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-extrabold text-slate-400 shadow-sm ml-2">
                  {columnRequests.length}
                </span>
              </div>

              {/* Cards container */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {columnRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-655 border border-dashed border-slate-900 rounded-xl p-4">
                    <Wrench className="w-8 h-8 mb-1.5 opacity-30" />
                    <span className="text-[11px]">No requests</span>
                  </div>
                ) : (
                  columnRequests.map((req) => {
                    const isHigh = req.priority === 'high';
                    const isMedium = req.priority === 'medium';
                    
                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/45 hover:border-slate-700/80 transition-all space-y-3 relative group"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              {req.asset?.tag || 'Asset'}
                            </span>
                            <h4 className="font-bold text-xs text-white leading-tight">
                              {req.asset?.name || 'Unknown Item'}
                            </h4>
                          </div>
                          
                          {/* Priority badge */}
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            isHigh 
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40' 
                              : isMedium 
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40' 
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                          }`}>
                            {req.priority}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-450 line-clamp-3 leading-relaxed">
                          {req.issue_description}
                        </p>

                        {/* Photo preview block */}
                        {req.photo_url && (
                          <div 
                            className="w-full h-24 rounded-lg overflow-hidden border border-slate-900 bg-slate-950 flex items-center justify-center cursor-zoom-in relative group/img"
                            onClick={() => setSelectedLightboxPhoto(req.photo_url || null)}
                          >
                            <img src={req.photo_url} alt="malfunction preview" className="object-cover w-full h-full hover:scale-105 transition-transform" />
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] font-bold text-slate-350 opacity-0 group-hover/img:opacity-100 transition-opacity">
                              Enlarge
                            </div>
                          </div>
                        )}

                        {/* Raiser info */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-950 text-[10px] text-slate-500">
                          <User className="w-3 h-3 text-slate-600" />
                          <span>By: {req.raiser?.name || 'Employee'}</span>
                        </div>

                        {/* Technician assigned label */}
                        {req.technician_name && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-950">
                            <Sparkles className="w-3 h-3" />
                            <span>Tech: {req.technician_name}</span>
                          </div>
                        )}

                        {/* Kanban workflow actions (restricted to Managers) */}
                        {canManage && (
                          <div className="pt-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            {req.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleStatusUpdate(req.id, 'approved')}
                                  className="flex-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 py-1 rounded hover:bg-emerald-900/40 transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                  className="text-[9px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/30 px-2 py-1 rounded hover:bg-rose-900/40 transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            
                            {req.status === 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'technician_assigned')}
                                className="w-full text-[9px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 py-1.5 rounded hover:bg-indigo-900/40 transition-all"
                              >
                                Assign Technician
                              </button>
                            )}

                            {req.status === 'technician_assigned' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                                className="w-full text-[9px] font-bold text-violet-400 bg-violet-950/40 border border-violet-900/30 py-1.5 rounded hover:bg-violet-900/40 transition-all"
                              >
                                Start Repairs
                              </button>
                            )}

                            {req.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'resolved')}
                                className="w-full text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 py-1.5 rounded hover:bg-emerald-900/40 transition-all"
                              >
                                Complete & Resolve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Maintenance Request Drawer Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden glass-panel rounded-2xl shadow-2xl border border-slate-800/80 bg-[#0c101d]">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                Raise Repair Request
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseRequest} className="p-6 space-y-4">
              
              {/* Asset Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Affected Asset</label>
                <select
                  required
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tag}) — Status: {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPriority(p)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                        formPriority === p 
                          ? p === 'high' 
                            ? 'bg-rose-950/60 border-rose-600 text-rose-300' 
                            : p === 'medium'
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Describe the Issue</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about the malfunction or damage..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Photo Attachment (URL or Local File) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence Photo</label>
                  <span className="text-[10px] text-slate-500 italic">Optional</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Paste image URL (e.g. https://...)..."
                    value={formPhotoUrl}
                    onChange={(e) => {
                      setFormPhotoUrl(e.target.value);
                      setFormPhoto(null); // clear file choice if url is pasted
                    }}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Or Choose Local File:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="text-xs text-slate-450 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-extrabold file:bg-indigo-950/40 file:text-indigo-400 file:cursor-pointer hover:file:bg-indigo-900/40"
                    />
                  </div>
                </div>
                {(formPhoto || formPhotoUrl) && (
                  <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-900 max-h-32 flex items-center justify-center bg-slate-950/40">
                    <img src={formPhoto || formPhotoUrl} alt="Evidence preview" className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    <button
                      type="button"
                      onClick={() => {
                        setFormPhoto(null);
                        setFormPhotoUrl('');
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black/90 p-1.5 rounded-full text-rose-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/20 transition-all text-sm"
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Technician Assignment Dialog Modal */}
      {assigningRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden glass-panel rounded-2xl shadow-2xl border border-slate-800/80 bg-[#0c101d]">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                Assign Service Technician
              </h3>
              <button
                onClick={() => setAssigningRequestId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Technician Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setAssigningRequestId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/20 transition-all text-sm"
                >
                  Assign & Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Asset Maintenance History Inspector Panel */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Asset Maintenance History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of all repair requests, technician assignments, and resolutions for a selected asset.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Asset to Inspect</label>
            <select
              value={historyAssetId}
              onChange={(e) => setHistoryAssetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-950 text-slate-100">-- Choose an Asset --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-950 text-slate-100">
                  {a.name} ({a.tag})
                </option>
              ))}
            </select>
          </div>
        </div>

        {historyAssetId && (
          <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
            {requests.filter(r => r.asset_id === historyAssetId).length === 0 ? (
              <p className="p-6 text-sm text-slate-500 italic text-center">No maintenance history logged for this asset.</p>
            ) : (
              <div className="divide-y divide-slate-900">
                {requests.filter(r => r.asset_id === historyAssetId).map((r) => {
                  const start = new Date(r.created_at);
                  const end = r.resolved_at ? new Date(r.resolved_at) : null;
                  
                  return (
                    <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'resolved' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                              : r.status === 'rejected'
                              ? 'bg-rose-950 text-rose-300 border border-rose-900'
                              : 'bg-amber-950 text-amber-300 border border-amber-900'
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                          <span className="font-bold text-white text-sm">{r.issue_description}</span>
                        </div>
                        <p className="text-slate-400">
                          Raised by: <span className="text-slate-350">{r.raiser?.name || 'Employee'}</span> · Created: <span className="text-slate-350">{start.toLocaleString()}</span>
                        </p>
                        {r.technician_name && (
                          <p className="text-slate-400">
                            Technician: <span className="text-indigo-400">{r.technician_name}</span>
                          </p>
                        )}
                        {r.photo_url && (
                          <div 
                            className="mt-2 w-16 h-16 rounded overflow-hidden border border-slate-800 cursor-zoom-in hover:scale-105 transition-transform"
                            onClick={() => setSelectedLightboxPhoto(r.photo_url || null)}
                          >
                            <img src={r.photo_url} alt="Attachment Preview" className="object-cover w-full h-full" />
                          </div>
                        )}
                      </div>
                      
                      {end && (
                        <div className="text-right text-slate-450 shrink-0">
                           <p className="font-semibold text-slate-300">Resolved Date</p>
                           <p>{end.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedLightboxPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out animate-fade-in"
          onClick={() => setSelectedLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center shadow-2xl">
            <img 
              src={selectedLightboxPhoto} 
              alt="Evidence high resolution" 
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setSelectedLightboxPhoto(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-xl text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
