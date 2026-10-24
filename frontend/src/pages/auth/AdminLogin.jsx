import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ShieldCheck, ArrowLeft, Flame, Activity } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError("Your email address has not been confirmed yet. Please verify your email via the confirmation link sent to your inbox, or disable email confirmation in your Supabase Auth settings.");
      } else {
        setError(error.message);
      }
    } else {
      // Check role strictly for admin
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setError("Access denied. Admin privileges required.");
      } else {
        navigate('/admin/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#140F0D] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      
      <div className="max-w-md mx-auto w-full mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ZaikaPulse Home
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#1C1715] p-8 sm:p-10 rounded-3xl border border-stone-800 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-stone-800 text-orange-400 rounded-2xl flex items-center justify-center border border-stone-700">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl text-white">Fleet Master Admin</h2>
          <p className="text-xs text-stone-400">Restricted administrative node for system operations</p>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/50 border border-red-900 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">Admin Identifier</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zaikapulse.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white placeholder-stone-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">Passkey</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-xs font-medium text-white placeholder-stone-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Authenticate Admin Session</span>
          </button>
        </form>

        <div className="pt-4 border-t border-stone-800 text-center text-xs space-y-2 text-stone-400">
          <div>
            <span>Looking for customer portal? </span>
            <Link to="/login" className="font-bold text-orange-400 hover:underline">
              Diner Sign In
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
