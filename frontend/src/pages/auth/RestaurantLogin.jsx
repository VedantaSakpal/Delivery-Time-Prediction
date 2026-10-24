import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Store, ArrowLeft, ChefHat } from 'lucide-react';

export default function RestaurantLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const navigate                = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (authError) {
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError("Your email address has not been confirmed yet. Please verify your email via the confirmation link sent to your inbox, or disable email confirmation in your Supabase Auth settings.");
      } else {
        setError(authError.message);
      }
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.role !== 'restaurant') {
        await supabase.auth.signOut();
        setError('This portal is strictly for registered restaurant partner accounts. (Use /login for diner accounts)');
      } else {
        navigate('/restaurant/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white">
      
      <div className="max-w-md mx-auto w-full mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6E6157] hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ZaikaPulse Home
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-amber-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-xs">
            <ChefHat className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl text-[#191411]">Kitchen Partner Portal</h2>
          <p className="text-xs text-[#6E6157]">Manage incoming orders, prep queues, and menu availability</p>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191411]">Kitchen Partner Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kitchen@zaikapulse.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#191411]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Open Kitchen Console</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#ECE4D8] text-center text-xs space-y-2 text-[#6E6157]">
          <div>
            <span>Are you a diner? </span>
            <Link to="/login" className="font-bold text-orange-600 hover:underline">
              Customer Sign In
            </Link>
          </div>
          <div>
            <Link to="/admin/login" className="text-[11px] font-medium text-[#938376] hover:text-[#191411]">
              Fleet Admin Portal →
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
