import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getMockData, setMockData } from '../../lib/mockDb';
import { Profile, Department, UserRole } from '../../lib/types';
import { Boxes, Mail, UserPlus, LogIn, Sparkles, CheckCircle2, Lock, HelpCircle, Shield, User, Info, Settings, Plus, ToggleLeft, ToggleRight, UserCheck, ArrowRight, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  
  // View mode: signin, signup, forgot, forgot_email, or admin_console
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'forgot_email' | 'admin_console'>('signin');
  
  // Form values - authentication
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Inline editing states for Login directory
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');

  // Admin credentials verification for console access
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentAdminProfile, setCurrentAdminProfile] = useState<Profile | null>(null);

  // Form values - Create Employee
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [empPassword, setEmpPassword] = useState('employee123');

  // Directory lists
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Recovery outputs
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDirectoryData = () => {
    setProfiles(getMockData<Profile>('profiles'));
    setDepartments(getMockData<Department>('departments'));
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadDirectoryData();
    }
  }, [isAdminAuthenticated]);

  // Trigger FormSubmit submission through hidden iframe once OTP is generated
  useEffect(() => {
    if (generatedOtp && email && mode === 'forgot' && !otpSent) {
      const form = document.getElementById('otp-email-form') as HTMLFormElement;
      if (form) {
        console.log(`[AssetFlow OTP Debug] Generated code for ${email}: ${generatedOtp}`);
        form.submit();
        setOtpSent(true);
        setSuccessMsg(`OTP request has been dispatched to: ${email}. If this is your first time using this service, please check your email (and Spam folder) for a "FormSubmit Activation" confirmation email and click it to authorize delivery!`);
        setLoading(false);
      }
    }
  }, [generatedOtp, email, mode]);

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const list = getMockData<Profile>('profiles');
    const found = list.find(p => p.email.toLowerCase() === adminEmail.trim().toLowerCase());
    
    if (!found) {
      setErrorMsg('No profile found with this email.');
      return;
    }
    if (found.role !== 'admin') {
      setErrorMsg('Access denied: You must be an administrator to open this console.');
      return;
    }
    if (adminPassword !== found.password) {
      setErrorMsg('Incorrect password. Please try again.');
      return;
    }

    setIsAdminAuthenticated(true);
    setCurrentAdminProfile(found);
    setSuccessMsg(`Welcome, ${found.name}! Admin Directory Console unlocked.`);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!empName.trim() || !empEmail.trim()) {
      setErrorMsg('Please fill in Name and Email.');
      return;
    }

    const list = getMockData<Profile>('profiles');
    if (list.some(p => p.email.toLowerCase() === empEmail.trim().toLowerCase())) {
      setErrorMsg('An employee with this email already exists.');
      return;
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: empName.trim(),
      email: empEmail.trim(),
      department_id: empDept || null,
      role: empRole,
      status: 'active',
      created_at: new Date().toISOString(),
      password: empPassword
    };

    list.push(newProfile);
    setMockData('profiles', list);
    setEmpName('');
    setEmpEmail('');
    setEmpDept('');
    setEmpRole('employee');
    setEmpPassword('employee123');
    setSuccessMsg(`Employee account created successfully for ${newProfile.name}!`);
    loadDirectoryData();
  };

  const handleRoleChange = (profileId: string, nextRole: UserRole) => {
    const list = getMockData<Profile>('profiles');
    const updated = list.map(p => p.id === profileId ? { ...p, role: nextRole } : p);
    setMockData('profiles', updated);
    setSuccessMsg('Employee role updated successfully!');
    loadDirectoryData();
  };

  const handleToggleEmployeeStatus = (profileId: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const list = getMockData<Profile>('profiles');
    const updated = list.map(p => p.id === profileId ? { ...p, status: nextStatus } : p);
    setMockData('profiles', updated);
    setSuccessMsg(`Employee status updated to ${nextStatus}!`);
    loadDirectoryData();
  };

  const handleProceedToDashboard = async () => {
    if (!currentAdminProfile) return;
    setLoading(true);
    try {
      await login(currentAdminProfile.email, currentAdminProfile.password);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = (empId: string) => {
    if (!editingName.trim() || !editingEmail.trim()) return;
    const list = getMockData<Profile>('profiles');
    const updated = list.map(p => p.id === empId ? { ...p, name: editingName.trim(), email: editingEmail.trim() } : p);
    setMockData('profiles', updated);
    
    // Update underlying Supabase database profiles if configured
    if (isSupabaseConfigured) {
      supabase.from('profiles').update({ name: editingName.trim(), email: editingEmail.trim() }).eq('id', empId).catch(err => {
        console.error("Supabase edit sync error:", err);
      });
    }

    setEditingId(null);
    setSuccessMsg('Employee details updated successfully!');
    loadDirectoryData();
  };

  // OTP Send Trigger (Generates OTP, effect will submit the form)
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const list = getMockData<Profile>('profiles');
    const found = list.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setErrorMsg('No profile found with this email address.');
      setLoading(false);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
  };

  // OTP Reset submit
  const handleOtpResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (enteredOtp !== generatedOtp) {
      setErrorMsg('Incorrect OTP code. Please verify the code and try again.');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    const list = getMockData<Profile>('profiles');
    const updated = list.map(p => p.email.toLowerCase() === email.trim().toLowerCase() ? { ...p, password: newPassword } : p);
    setMockData('profiles', updated);

    // If Supabase is configured, update the password in Supabase Auth & underlying profiles table
    if (isSupabaseConfigured) {
      supabase.auth.updateUser({ password: newPassword }).catch(err => {
        console.error("Supabase Auth password update error:", err);
      });
      supabase.from('profiles').update({ password: newPassword }).eq('email', email.trim().toLowerCase()).catch(err => {
        console.error("Supabase database profiles update error:", err);
      });
    }

    // Reset recovery state and redirect
    setOtpSent(false);
    setGeneratedOtp('');
    setEnteredOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setEmail('');
    setMode('signin');
    setSuccessMsg('Your password has been reset successfully! Please sign in using your new password.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecoveredEmail(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
        setSuccessMsg('Logged in successfully!');
      } else if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!password) {
          throw new Error('Please set a password for your account.');
        }
        await signup(email.trim(), name.trim(), password);
        setSuccessMsg('Account registered successfully! Welcome to AssetFlow.');
      } else if (mode === 'forgot_email') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        const list = getMockData<Profile>('profiles');
        const found = list.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
        if (!found) {
          throw new Error('No profile found with this name. Check spelling or try registering.');
        }
        setRecoveredEmail(found.email);
        setSuccessMsg(`Recovery successful: Your registered email is shown below.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#050811] relative overflow-hidden font-sans py-12">
      
      {/* Hidden HTML Form targeting a hidden Iframe to execute CORS-free email relay */}
      {generatedOtp && email && (
        <>
          <form
            id="otp-email-form"
            action={`https://formsubmit.co/${email.trim()}`}
            method="POST"
            target="otp-relay-iframe"
            style={{ display: 'none' }}
          >
            <input type="hidden" name="_subject" value="AssetFlow Portal - OTP Reset Request Verification" />
            <input type="hidden" name="message" value={`Hello,\n\nA password reset request was triggered on the AssetFlow ERP system.\n\nYour secure 6-digit OTP code is: ${generatedOtp}\n\nIf you did not initiate this request, please ignore this email.\n\nRegards,\nAssetFlow Security Team`} />
            <input type="hidden" name="_captcha" value="false" />
          </form>
          <iframe id="otp-relay-iframe" name="otp-relay-iframe" style={{ display: 'none' }}></iframe>
        </>
      )}

      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl" />

      {/* Auth Card Container */}
      <div className={`w-full ${mode === 'admin_console' && isAdminAuthenticated ? 'max-w-5xl' : 'max-w-md'} p-8 glass-panel border border-slate-900 rounded-3xl shadow-2xl relative z-10 space-y-6 mx-4 transition-all duration-300 animate-fade-in`}>
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">AssetFlow Portal</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise Resource Planning & Lifecycle Management</p>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-350 font-medium animate-slide-up">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-emerald-350 font-medium flex flex-col gap-2 animate-slide-up">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            {recoveredEmail && (
              <div className="mt-2 p-2.5 bg-slate-950/80 rounded-lg border border-emerald-800/20 text-center animate-slide-up">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Email Address</span>
                <span className="text-sm font-mono text-emerald-400 font-extrabold">{recoveredEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1: ADMIN DIRECTORY CONSOLE (AUTHENTICATED) */}
        {mode === 'admin_console' && isAdminAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 animate-fade-in">
            
            {/* Create form panel */}
            <div className="lg:col-span-1 glass-panel border border-slate-900/60 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Employee
              </h3>
              
              <form onSubmit={handleCreateEmployee} className="space-y-3.5">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Kumar"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-200 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Corporate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. amit@company.com"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-200 outline-none font-medium"
                  >
                    <option value="" className="bg-slate-950">None (Top-Level)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-950">{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Security Role</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as UserRole)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-200 outline-none font-medium"
                  >
                    <option value="employee" className="bg-slate-950">Employee</option>
                    <option value="department_head" className="bg-slate-950">Department Head</option>
                    <option value="asset_manager" className="bg-slate-950">Asset Manager</option>
                    <option value="admin" className="bg-slate-950">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer"
                >
                  Create Account
                </button>
              </form>

              <div className="pt-2 border-t border-slate-900 flex flex-col gap-2">
                <button
                  onClick={handleProceedToDashboard}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-600 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  Proceed to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List panel */}
            <div className="lg:col-span-2 glass-panel border border-slate-900/60 rounded-2xl overflow-hidden h-fit">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/20 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {profiles.map(emp => {
                    const dep = departments.find(d => d.id === emp.department_id);
                    const isOtherAdmin = emp.role === 'admin' && emp.id !== currentAdminProfile?.id;
                    
                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/5 transition-colors">
                        <td className="p-3.5 font-bold text-white text-xs">
                          {editingId === emp.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-indigo-500 w-28 font-medium"
                            />
                          ) : (
                            emp.name
                          )}
                        </td>
                        <td className="p-3.5 text-slate-350">
                          {editingId === emp.id ? (
                            <input
                              type="email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-indigo-500 w-36 font-medium"
                            />
                          ) : (
                            emp.email
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">{dep ? dep.name : <span className="italic text-slate-650 text-[10px]">Unassigned</span>}</td>
                        <td className="p-3.5">
                          <select
                            value={emp.role}
                            disabled={isOtherAdmin}
                            onChange={(e) => handleRoleChange(emp.id, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-850 rounded-lg p-1 text-[11px] text-slate-300 font-medium outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="employee">Employee</option>
                            <option value="department_head">Dept Head</option>
                            <option value="asset_manager">Asset Mgr</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            emp.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingId === emp.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(emp.id)}
                                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900 rounded text-emerald-400 hover:text-emerald-250 transition font-bold text-[10px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-805 rounded text-slate-400 hover:text-white transition font-bold text-[10px]"
                                >
                                  X
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    if (isOtherAdmin) return;
                                    setEditingId(emp.id);
                                    setEditingName(emp.name);
                                    setEditingEmail(emp.email);
                                  }}
                                  disabled={isOtherAdmin}
                                  className="px-2 py-0.5 hover:bg-slate-850 border border-slate-800 rounded text-slate-350 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed font-bold text-[10px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                                  disabled={isOtherAdmin}
                                  className="p-1 hover:bg-slate-850 border border-slate-900 rounded-lg text-slate-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Toggle Status"
                                >
                                  {emp.status === 'active' ? (
                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <UserCheck className="w-4 h-4 text-slate-650" />
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

          </div>
        )}

        {/* VIEW 2: ADMIN DIRECTORY CONSOLE (SIGN IN PROMPT) */}
        {mode === 'admin_console' && !isAdminAuthenticated && (
          <form onSubmit={handleAdminVerify} className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" />
                Unlock Admin Console
              </h3>
              <p className="text-[11px] text-slate-400">Please verify administrative credentials to manage employees.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Admin Email</label>
              <input
                type="email"
                required
                placeholder="e.g. aadarsh@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Admin Password</label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 rounded-xl font-extrabold text-xs text-white shadow-lg shadow-indigo-650/10 transition cursor-pointer"
            >
              Verify & Open Console
            </button>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD - OTP RESET FLOW */}
        {mode === 'forgot' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Reset Your Password
              </h3>
              <p className="text-[11px] text-slate-450">We will verify your identity with a secure OTP code.</p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Corporate Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kravi1610@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 rounded-xl font-extrabold text-xs text-white shadow-lg transition cursor-pointer disabled:opacity-40 animate-pulse"
                >
                  {loading ? 'Dispatched. Waiting...' : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpResetSubmit} className="space-y-4 animate-slide-up">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 text-center tracking-widest outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 rounded-xl font-extrabold text-xs text-white shadow-lg transition cursor-pointer"
                >
                  Verify & Reset Password
                </button>
              </form>
            )}
          </div>
        )}

        {/* VIEW 4: SIGN IN, SIGN UP, FORGOT EMAIL ID */}
        {mode !== 'admin_console' && mode !== 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ravi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot_email' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Corporate Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. kravi1610@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot_email' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                  {mode === 'signin' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot_email');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          setRecoveredEmail(null);
                          setName('');
                        }}
                        className="text-[10px] text-indigo-400 hover:underline font-bold"
                      >
                        Forgot Email ID?
                      </button>
                      <span className="text-[10px] text-slate-655">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          setRecoveredEmail(null);
                          setEmail('');
                          setOtpSent(false);
                        }}
                        className="text-[10px] text-indigo-400 hover:underline font-bold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 rounded-xl font-extrabold text-xs text-white shadow-lg shadow-indigo-650/10 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register Account
                </>
              )}
            </button>
          </form>
        )}

        {/* Toggle Mode Switcher link */}
        <div className="text-center pt-2 border-t border-slate-900 flex flex-col gap-2">
          {mode !== 'signin' && (
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
                setRecoveredEmail(null);
                setIsAdminAuthenticated(false);
                setCurrentAdminProfile(null);
                setOtpSent(false);
                setPassword('');
                setEmail('');
                setName('');
              }}
              className="text-xs text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          )}

          {mode === 'signin' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400 font-medium">
                New employee?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setRecoveredEmail(null);
                    setOtpSent(false);
                    setPassword('');
                    setEmail('');
                    setName('');
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setMode('admin_console');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setAdminEmail('');
                  setAdminPassword('');
                }}
                className="text-xs text-emerald-455 hover:underline font-bold flex items-center justify-center gap-1 cursor-pointer mt-1"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin Directory Console
              </button>
            </div>
          )}
        </div>

        {/* Reference Seed accounts directory helper note */}
        {mode !== 'admin_console' && (
          <div className="p-3 bg-indigo-950/10 border border-indigo-950/30 rounded-xl space-y-1 animate-fade-in font-medium">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-bold text-indigo-350 uppercase">Preseeded Team Accounts</span>
            </div>
            <div className="text-[9px] text-slate-400 leading-normal space-y-0.5 max-h-40 overflow-y-auto">
              <p>1. <strong>Aadarsh Nath</strong> (Admin) — <code>aadarsh@company.com</code> | <code>admin123</code></p>
              <p>2. <strong>Yash Raj</strong> (Admin) — <code>yash@company.com</code> | <code>admin123</code></p>
              <p>3. <strong>Fahad Hassan</strong> (Admin) — <code>fahad@company.com</code> | <code>admin123</code></p>
              <p>4. <strong>Mrinal Kishor</strong> (Admin) — <code>mrinal@company.com</code> | <code>admin123</code></p>
              <p>5. <strong>Sarah Jenkins</strong> (Asset Mgr) — <code>sarah@company.com</code> | <code>employee123</code></p>
              <p>6. <strong>Amit Kumar</strong> (Dept Head) — <code>amit@company.com</code> | <code>employee123</code></p>
              <p>7. <strong>Ravi Kumar</strong> (Employee) — <code>kravi1610@gmail.com</code> | <code>employee123</code></p>
              <p>8. <strong>Rahul Verma</strong> (Employee) — <code>rahul@company.com</code> | <code>employee123</code></p>
              <p>9. <strong>Deepa Patel</strong> (Employee) — <code>deepa@company.com</code> | <code>employee123</code></p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default Login;
