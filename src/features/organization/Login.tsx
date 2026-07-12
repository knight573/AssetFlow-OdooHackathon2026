import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { getMockData } from '../../lib/mockDb';
import { Profile } from '../../lib/types';
import { Boxes, Mail, UserPlus, LogIn, Sparkles, CheckCircle2, Lock, HelpCircle, Shield, User, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  
  // View mode: signin, signup, forgot, or forgot_email
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'forgot_email'>('signin');
  
  // Form values
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  // Recovery outputs
  const [recoveredEmail, setRecoveredEmail] = useState<string | null>(null);
  const [recoveryPassword, setRecoveryPassword] = useState<string | null>(null);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setRecoveryPassword(null);
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
      } else if (mode === 'forgot') {
        const list = getMockData<Profile>('profiles');
        const found = list.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
        if (!found) {
          throw new Error('No profile found with this email.');
        }
        const pwd = found.password || 'password123';
        setRecoveryPassword(pwd);
        setSuccessMsg(`Recovery successful: Your password is shown below.`);
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
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#050811] relative overflow-hidden font-sans">
      
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-650/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl" />

      {/* Auth Card Container */}
      <div className="w-full max-w-md p-8 glass-panel border border-slate-900 rounded-3xl shadow-2xl relative z-10 space-y-6 mx-4 animate-fade-in">
        
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
            {recoveryPassword && (
              <div className="mt-2 p-2.5 bg-slate-950/80 rounded-lg border border-emerald-800/20 text-center animate-slide-up">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Password</span>
                <span className="text-sm font-mono text-emerald-400 font-extrabold">{recoveryPassword}</span>
              </div>
            )}
            {recoveredEmail && (
              <div className="mt-2 p-2.5 bg-slate-950/80 rounded-lg border border-emerald-800/20 text-center animate-slide-up">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Email Address</span>
                <span className="text-sm font-mono text-emerald-400 font-extrabold">{recoveredEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(mode === 'signup' || mode === 'forgot_email') && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
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
                  placeholder="e.g. employee@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-4 rounded-xl bg-slate-950/60 border border-slate-850 focus:border-indigo-500 text-xs font-semibold text-slate-200 outline-none transition"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && mode !== 'forgot_email' && (
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
                        setRecoveryPassword(null);
                        setName('');
                      }}
                      className="text-[10px] text-indigo-400 hover:underline font-bold"
                    >
                      Forgot Email ID?
                    </button>
                    <span className="text-[10px] text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setRecoveredEmail(null);
                        setRecoveryPassword(null);
                        setEmail('');
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
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                Register Account
              </>
            ) : mode === 'forgot' ? (
              <>
                <HelpCircle className="w-4 h-4" />
                Recover Password
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Recover Email ID
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Switcher link */}
        <div className="text-center pt-2 border-t border-slate-900 flex flex-col gap-2">
          {mode !== 'signin' && (
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
                setRecoveredEmail(null);
                setRecoveryPassword(null);
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
            <p className="text-xs text-slate-400 font-medium">
              New employee?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setRecoveredEmail(null);
                  setRecoveryPassword(null);
                  setPassword('');
                  setEmail('');
                  setName('');
                }}
                className="text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

        {/* Reference Seed accounts directory helper note */}
        <div className="p-3 bg-indigo-950/10 border border-indigo-950/30 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-[10px] font-bold text-indigo-350 uppercase">Preseeded Team Accounts (Forgot recovery directory)</span>
          </div>
          <div className="text-[9px] text-slate-400 leading-normal space-y-0.5">
            <p>1. <strong>Aadarsh Nath</strong> (Admin) — Default password: <code>password123</code></p>
            <p>2. <strong>Yash Raj</strong> (Asset Manager) — Default password: <code>password123</code></p>
            <p>3. <strong>Priya Shah</strong> (Employee) — Default password: <code>password123</code></p>
            <p>4. <strong>Arjun Nair</strong> (Department Head) — Default password: <code>password123</code></p>
            <p>5. <strong>Sarah Jenkins</strong> (Employee) — Default password: <code>password123</code></p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
