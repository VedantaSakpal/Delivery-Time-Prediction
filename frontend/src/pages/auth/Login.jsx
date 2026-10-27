import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { Mail, Lock, Loader2, Flame, ArrowLeft, Star, ShieldCheck, Sparkles } from 'lucide-react';

export default function Login() {
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
      // Check role strictly for normal user
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if (profile?.role === 'admin') {
        await supabase.auth.signOut();
        setError("Admin accounts must use the Fleet Admin Login portal (/admin/login).");
      } else if (profile?.role === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      
      {/* Top Home link */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6E6157] hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to justwoww Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl border border-[#ECE4D8] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left Visual Column */}
        <div className="md:col-span-5 bg-stone-900 text-white p-8 relative flex flex-col justify-between overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
            alt="Indian Biryani Handi"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191411] via-[#191411]/70 to-transparent" />
          
          <div className="relative z-10 space-y-3">
            <Logo size="md" theme="dark" tagline="Instant Food • Punctual Delivery" to="/" />
          </div>

          <div className="relative z-10 space-y-4 pt-16">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-300 italic leading-relaxed">
              "The arrival accuracy is mind-blowing. When the app predicted 24 minutes during Friday evening rush hour, my Dum Biryani arrived steaming hot at minute 23."
            </p>
            <div className="text-[11px] text-stone-400 font-medium">
              — Ananya Sharma, Bandra West, Mumbai
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div>
            <h2 className="font-display font-black text-3xl text-[#191411]">Sign in to your account</h2>
            <p className="text-xs text-[#6E6157] mt-1">Access your orders, saved addresses, and prediction history</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#191411]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Sign In</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#ECE4D8] text-xs space-y-2 text-center text-[#6E6157]">
            <div>
              <span>New foodie? </span>
              <Link to="/register" className="font-bold text-orange-600 hover:underline">
                Create an account
              </Link>
            </div>
            <div className="pt-2 flex justify-center gap-4 text-[11px]">
              <Link to="/restaurant/login" className="font-semibold text-amber-700 hover:underline">
                Restaurant Portal →
              </Link>
              <span>•</span>
              <Link to="/admin/login" className="font-semibold text-[#191411] hover:underline">
                Fleet Admin →
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
