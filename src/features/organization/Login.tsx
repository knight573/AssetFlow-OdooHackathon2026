import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Boxes, Mail, UserPlus, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup } = useAuth();
  
  // View mode: signin or signup
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Form values
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email.trim());
        setSuccessMsg('Logged in successfully!');
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signup(email.trim(), name.trim());
        setSuccessMsg('Account registered successfully! Welcome to AssetFlow.');
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
          <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-350 font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-emerald-350 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
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

        {/* Toggle Mode Switcher link */}
        <div className="text-center pt-2 border-t border-slate-950/60">
          {mode === 'signin' ? (
            <p className="text-xs text-slate-400">
              New employee?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Dynamic Sandbox Note */}
        <div className="p-3 bg-indigo-950/10 border border-indigo-950/30 rounded-xl flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
          <p className="text-[10px] text-slate-400 leading-normal">
            <strong>Simulation Note:</strong> In sandbox mode, signing in verifies against preseeded local accounts (e.g., <code>sarah@company.com</code>, <code>priya@company.com</code>).
          </p>
        </div>

      </div>
    </div>
  );
};
export default Login;
