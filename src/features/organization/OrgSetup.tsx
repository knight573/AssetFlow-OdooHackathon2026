import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { Department, Category, Profile, UserRole } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { 
  Users, FolderGit2, Landmark, Plus, ArrowRight, Shield, 
  ToggleLeft, ToggleRight, UserCheck, Settings2, Trash2, CheckCircle2
} from 'lucide-react';

export const OrgSetup: React.FC = () => {
  const { profile: currentActor } = useAuth();
  
  // Tab State
  const [subTab, setSubTab] = useState<'departments' | 'categories' | 'employees'>('departments');
  
  // Data State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Loading & Alert States
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Inline editing states for Employees
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');

  // Form States - Departments
  const [newDepName, setNewDepName] = useState('');
  const [newDepParentId, setNewDepParentId] = useState('');
  const [newDepHeadId, setNewDepHeadId] = useState('');
  const [editingDepId, setEditingDepId] = useState<string | null>(null);

  // Form States - Categories
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [customFieldsList, setCustomFieldsList] = useState<Record<string, any>>({});

  // Reload data
  const loadData = async () => {
    setLoading(true);
    try {
      const depList = await db.getDepartments();
      const catList = await db.getCategories();
      const profList = await db.getProfiles();
      
      setDepartments(depList);
      setCategories(catList);
      setProfiles(profList);
    } catch (err) {
      console.error(err);
      triggerFeedback('Failed to load setup records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleDbChange = () => loadData();
    window.addEventListener('mock-db-change', handleDbChange);
    return () => window.removeEventListener('mock-db-change', handleDbChange);
  }, []);

  const triggerFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Department Handlers ---
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    try {
      setLoading(true);
      if (editingDepId) {
        // Edit Mode
        const rawList = JSON.parse(localStorage.getItem('assetflow_departments') || '[]') as Department[];
        const updated = rawList.map(d => d.id === editingDepId ? {
          ...d,
          name: newDepName.trim(),
          parent_department_id: newDepParentId || null,
          head_id: newDepHeadId || null
        } : d);
        localStorage.setItem('assetflow_departments', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'departments' } }));
        triggerFeedback('Department updated successfully!', 'success');
        setEditingDepId(null);
      } else {
        // Create Mode
        await db.createDepartment(
          newDepName.trim(),
          newDepParentId || null,
          newDepHeadId || null
        );
        triggerFeedback('Department created successfully!', 'success');
      }
      
      setNewDepName('');
      setNewDepParentId('');
      setNewDepHeadId('');
      loadData();
    } catch (err) {
      triggerFeedback('Failed to save department', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditDepartment = (dep: Department) => {
    setEditingDepId(dep.id);
    setNewDepName(dep.name);
    setNewDepParentId(dep.parent_department_id || '');
    setNewDepHeadId(dep.head_id || '');
  };

  const cancelEditDepartment = () => {
    setEditingDepId(null);
    setNewDepName('');
    setNewDepParentId('');
    setNewDepHeadId('');
  };

  const handleToggleDepartmentStatus = async (depId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const rawList = JSON.parse(localStorage.getItem('assetflow_departments') || '[]') as Department[];
      const updated = rawList.map(d => d.id === depId ? { ...d, status: nextStatus } : d);
      localStorage.setItem('assetflow_departments', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'departments' } }));
      triggerFeedback(`Department status updated to ${nextStatus}`, 'success');
    } catch (err) {
      triggerFeedback('Failed to update status', 'error');
    }
  };

  // --- Category Handlers ---
  const addCustomField = () => {
    if (!customFieldKey.trim() || !customFieldValue.trim()) return;
    setCustomFieldsList(prev => ({
      ...prev,
      [customFieldKey.trim()]: customFieldValue.trim()
    }));
    setCustomFieldKey('');
    setCustomFieldValue('');
  };

  const removeCustomField = (key: string) => {
    const next = { ...customFieldsList };
    delete next[key];
    setCustomFieldsList(next);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setLoading(true);
      if (editingCatId) {
        // Edit Mode
        const rawList = JSON.parse(localStorage.getItem('assetflow_categories') || '[]') as Category[];
        const updated = rawList.map(c => c.id === editingCatId ? {
          ...c,
          name: newCatName.trim(),
          custom_fields: customFieldsList
        } : c);
        localStorage.setItem('assetflow_categories', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'categories' } }));
        triggerFeedback('Asset Category updated!', 'success');
        setEditingCatId(null);
      } else {
        // Create Mode
        await db.createCategory(newCatName.trim(), customFieldsList);
        triggerFeedback('Asset Category registered!', 'success');
      }
      
      setNewCatName('');
      setCustomFieldsList({});
      loadData();
    } catch (err) {
      triggerFeedback('Failed to save category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setCustomFieldsList(cat.custom_fields || {});
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatName('');
    setCustomFieldsList({});
  };

  // --- Employee Handlers ---
  const handleRoleChange = async (profileId: string, nextRole: UserRole) => {
    if (!currentActor) return;
    try {
      setLoading(true);
      await db.updateProfileRole(profileId, nextRole, currentActor.id);
      triggerFeedback('Employee role promoted successfully!', 'success');
      loadData();
    } catch (err) {
      triggerFeedback('Failed to promote user role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = async (profileId: string, deptId: string) => {
    try {
      setLoading(true);
      const rawList = JSON.parse(localStorage.getItem('assetflow_profiles') || '[]') as Profile[];
      const updated = rawList.map(p => p.id === profileId ? { ...p, department_id: deptId || null } : p);
      localStorage.setItem('assetflow_profiles', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'profiles' } }));
      triggerFeedback('Employee department assigned successfully!', 'success');
      loadData();
    } catch (err) {
      triggerFeedback('Failed to assign department', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (employeeId: string, currentStatus: 'active' | 'inactive' | 'pending') => {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const rawList = JSON.parse(localStorage.getItem('assetflow_profiles') || '[]') as Profile[];
      const updated = rawList.map(p => p.id === employeeId ? { ...p, status: nextStatus } : p);
      localStorage.setItem('assetflow_profiles', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'profiles' } }));
      triggerFeedback(`Employee status updated to ${nextStatus}`, 'success');
    } catch (err) {
      triggerFeedback('Failed to update status', 'error');
    }
  };

  const handleSaveEdit = async (empId: string) => {
    if (!editingName.trim() || !editingEmail.trim()) return;
    try {
      const rawList = JSON.parse(localStorage.getItem('assetflow_profiles') || '[]') as Profile[];
      const updated = rawList.map(p => p.id === empId ? { ...p, name: editingName.trim(), email: editingEmail.trim() } : p);
      localStorage.setItem('assetflow_profiles', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'profiles' } }));
      triggerFeedback('Employee details updated successfully!', 'success');
      setEditingId(null);
    } catch (err) {
      triggerFeedback('Failed to update employee details', 'error');
    }
  };

  const handleApproveEmployee = async (employeeId: string) => {
    try {
      const rawList = JSON.parse(localStorage.getItem('assetflow_profiles') || '[]') as Profile[];
      const updated = rawList.map(p => p.id === employeeId ? { ...p, status: 'active' as const } : p);
      localStorage.setItem('assetflow_profiles', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'profiles' } }));
      triggerFeedback('Employee approved successfully!', 'success');
    } catch (err) {
      triggerFeedback('Failed to approve employee', 'error');
    }
  };

  const handleRejectEmployee = async (employeeId: string) => {
    try {
      const rawList = JSON.parse(localStorage.getItem('assetflow_profiles') || '[]') as Profile[];
      const updated = rawList.filter(p => p.id !== employeeId);
      localStorage.setItem('assetflow_profiles', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mock-db-change', { detail: { table: 'profiles' } }));
      triggerFeedback('Employee registration rejected and removed.', 'success');
    } catch (err) {
      triggerFeedback('Failed to reject employee', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Organization Setup</h1>
          <p className="text-slate-400 text-sm mt-1">Configure company hierarchy, asset categorization tags, and security levels (Screen 3).</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0 self-start">
          <button
            onClick={() => setSubTab('departments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              subTab === 'departments' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Departments
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              subTab === 'categories' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Asset Categories
          </button>
          <button
            onClick={() => setSubTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              subTab === 'employees' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Employees
          </button>
        </div>
      </div>

      {/* Action Notifications Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-up ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-450' 
            : 'bg-rose-950/20 border-rose-800/40 text-rose-450'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* TAB CONTENT 1: DEPARTMENTS */}
      {subTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create Form */}
          <div className="lg:col-span-1 glass-panel border border-slate-900 rounded-2xl p-6 h-fit space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              {editingDepId ? <Settings2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
              {editingDepId ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales, Marketing"
                  value={newDepName}
                  onChange={(e) => setNewDepName(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-medium text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Parent Department</label>
                <select
                  value={newDepParentId}
                  onChange={(e) => setNewDepParentId(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="" className="bg-slate-950">None (Top-Level)</option>
                  {departments.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-950">{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Department Head</label>
                <select
                  value={newDepHeadId}
                  onChange={(e) => setNewDepHeadId(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="" className="bg-slate-950">Unassigned</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-950">{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                {editingDepId && (
                  <button
                    type="button"
                    onClick={cancelEditDepartment}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-400 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white shadow-md transition disabled:opacity-40"
                >
                  {editingDepId ? 'Save Changes' : 'Create Node'}
                </button>
              </div>
            </form>
          </div>

          {/* List Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel border border-slate-900 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-4">Department</th>
                    <th className="p-4">Parent Level</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No departments added yet.</td>
                    </tr>
                  ) : (
                    departments.map(dep => {
                      const parent = departments.find(d => d.id === dep.parent_department_id);
                      const head = profiles.find(p => p.id === dep.head_id);
                      
                      return (
                        <tr key={dep.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 font-bold text-white text-sm">{dep.name}</td>
                          <td className="p-4 text-slate-400">
                            {parent ? (
                              <span className="flex items-center gap-1.5">
                                {parent.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-650 bg-slate-900/30 border border-slate-850/40 px-2 py-0.5 rounded-full font-medium">Top Level</span>
                            )}
                          </td>
                          <td className="p-4">
                            {head ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-200">{head.name}</span>
                                <span className="text-[9px] text-slate-500">{head.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                              dep.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {dep.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEditDepartment(dep)}
                                className="p-1.5 hover:bg-slate-850 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition"
                                title="Edit Department"
                              >
                                <Settings2 className="w-4 h-4 text-indigo-400" />
                              </button>
                              <button
                                onClick={() => handleToggleDepartmentStatus(dep.id, dep.status)}
                                className="p-1.5 hover:bg-slate-850 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition"
                                title="Toggle Status"
                              >
                                {dep.status === 'active' ? (
                                  <ToggleRight className="w-5 h-5 text-indigo-400" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ASSET CATEGORIES */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create Form */}
          <div className="lg:col-span-1 glass-panel border border-slate-900 rounded-2xl p-6 h-fit space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              {editingCatId ? <Settings2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
              {editingCatId ? 'Edit Category' : 'Add Category'}
            </h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT Equipment, Lab Tools"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-medium text-slate-200 outline-none"
                />
              </div>

              {/* Custom Metadata Fields Builder */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Define Custom Fields</span>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Field Key (e.g. wattage)"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-300 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 60W)"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Local Fields Preview list */}
                {Object.keys(customFieldsList).length > 0 && (
                  <div className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
                    {Object.entries(customFieldsList).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="text-slate-450 font-mono font-medium">{k}: <span className="text-slate-300">{String(v)}</span></span>
                        <button
                          type="button"
                          onClick={() => removeCustomField(k)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {editingCatId && (
                  <button
                    type="button"
                    onClick={cancelEditCategory}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-400 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xs text-white shadow-md transition disabled:opacity-40"
                >
                  {editingCatId ? 'Save Changes' : 'Register Category'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="glass-panel border border-slate-900 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base">{cat.name}</h4>
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="p-1 hover:bg-slate-850 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition"
                        title="Edit Category"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  
                  {/* Category Custom Fields Metadata Box */}
                  <div className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Custom Attributes</span>
                    {Object.keys(cat.custom_fields || {}).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic">No custom metadata tags</span>
                    ) : (
                      Object.entries(cat.custom_fields).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">{k}:</span>
                          <span className="text-slate-200 font-semibold">{String(v)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 3: EMPLOYEE DIRECTORY */}
      {subTab === 'employees' && (
        <div className="glass-panel border border-slate-900 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-4">Employee</th>
                <th className="p-4">Department Connection</th>
                <th className="p-4">Security Role (RBAC)</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {profiles.map(emp => {
                const dep = departments.find(d => d.id === emp.department_id);
                
                return (
                  <tr key={emp.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-bold text-indigo-400 border border-slate-850">
                        {emp.name.charAt(0)}
                      </div>
                      {editingId === emp.id ? (
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                            placeholder="Email"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{emp.name}</span>
                          <span className="text-[10px] text-slate-500">{emp.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <select
                        value={emp.department_id || ''}
                        onChange={(e) => handleDeptChange(emp.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-semibold focus:outline-none"
                      >
                        <option value="" className="bg-slate-950">Unassigned</option>
                        {departments.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={d.id} className="bg-slate-950">{d.name}</option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value as UserRole)}
                          disabled={emp.role === 'admin' && emp.id !== currentActor?.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-medium focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="employee">Employee</option>
                          <option value="department_head">Department Head</option>
                          <option value="asset_manager">Asset Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                        emp.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : emp.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveEmployee(emp.id)}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-emerald-400 hover:text-emerald-200 transition font-bold text-[10px] tracking-wide"
                              title="Approve Candidate"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectEmployee(emp.id)}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded-lg text-rose-400 hover:text-white transition font-bold text-[10px] tracking-wide"
                              title="Reject & Delete Candidate"
                            >
                              Reject
                            </button>
                          </>
                        ) : editingId === emp.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(emp.id)}
                              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg text-emerald-400 hover:text-emerald-200 transition font-bold text-[10px] tracking-wide"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-855 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition font-bold text-[10px] tracking-wide"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (emp.role === 'admin' && emp.id !== currentActor?.id) return;
                                setEditingId(emp.id);
                                setEditingName(emp.name);
                                setEditingEmail(emp.email);
                              }}
                              disabled={emp.role === 'admin' && emp.id !== currentActor?.id}
                              className="px-2.5 py-1 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-350 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[10px]"
                            >
                              Edit Info
                            </button>
                            <button
                              onClick={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                              disabled={emp.role === 'admin' && emp.id !== currentActor?.id}
                              className="p-1.5 hover:bg-slate-850 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Toggle Access"
                            >
                              {emp.status === 'active' ? (
                                <UserCheck className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <UserCheck className="w-5 h-5 text-slate-655" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
export default OrgSetup;
