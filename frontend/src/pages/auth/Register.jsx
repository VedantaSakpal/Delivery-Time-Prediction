import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { Mail, Lock, User, Loader2, Flame, ArrowLeft, Star, Sparkles } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const { data, error } = await supabase.auth.signUp({ 
      email: email.trim(), 
      password,
      options: {
        data: { full_name: fullName.trim() }
      }
    });
    
    if (error) {
      setError(error.message);
    } else if (data?.user && !data?.session) {
      setSuccessMsg("Registration successful! Please check your email inbox to confirm your account before signing in, or sign in directly if email confirmation is disabled.");
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
    } else {
      // User is immediately authenticated
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            role: 'user'
          });
        } catch (e) {
          // Trigger or context handles this
        }
      }
      navigate('/user/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-white">
      
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
            src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80"
            alt="Authentic Indian Biryani & Spices"
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
              "Finally, a delivery app that respects hunger and punctuality. The ML forecast keeps me updated without having to stare at generic 45-60 min placeholders."
            </p>
            <div className="text-[11px] text-stone-400 font-medium">
              — Rohan Mehta, Indiranagar, Bengaluru
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div>
            <h2 className="font-display font-black text-3xl text-[#191411]">Create your account</h2>
            <p className="text-xs text-[#6E6157] mt-1">Start experiencing punctual artisan food delivery</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#191411]">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Create Free Account</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#ECE4D8] text-xs text-center text-[#6E6157]">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-orange-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
