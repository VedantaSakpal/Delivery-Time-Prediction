import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Loader2, Store, ArrowLeft, ChefHat, Sparkles,
  AlertCircle, Clock, ShieldCheck, XCircle, RefreshCw
} from 'lucide-react';

export default function RestaurantLogin() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [underReviewApp, setUnderReviewApp] = useState(null);
  const [rejectedApp, setRejectedApp] = useState(null);
  const navigate                      = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnderReviewApp(null);
    setRejectedApp(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Auth Sign In
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authError) {
      // Before showing invalid login, check if there's an application status to guide user
      try {
        const appRes = await api.get(`/restaurants/application-status?email=${encodeURIComponent(cleanEmail)}`);
        if (appRes.data?.status === 'pending_approval') {
          setUnderReviewApp(appRes.data.application);
          setLoading(false);
          return;
        } else if (appRes.data?.status === 'rejected') {
          setRejectedApp(appRes.data.application);
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        // Ignore check error and show auth error
      }

      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError("Your email address has not been confirmed yet. Please verify your email via the confirmation link sent to your inbox.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // 2. User successfully authenticated with Supabase Auth
    try {
      // Check if user has an existing restaurant in the database
      const { data: restList } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', data.user.id);

      if (restList && restList.length > 0) {
        const restaurant = restList[0];
        // Check if terminated
        if (restaurant.description && restaurant.description.includes('[PARTNERSHIP_TERMINATED:')) {
          await supabase.auth.signOut();
          setError("Your restaurant partnership is currently suspended by Zaika Fleet Administration. Please contact partner-support@zaikapulse.com for reinstatement assistance.");
          setLoading(false);
          return;
        }
        // Active restaurant partner
        navigate('/restaurant/dashboard');
        return;
      }

      // If no restaurant record found, check application review status
      const appRes = await api.get(`/restaurants/application-status?email=${encodeURIComponent(cleanEmail)}`);
      if (appRes.data?.status === 'pending_approval') {
        await supabase.auth.signOut();
        setUnderReviewApp(appRes.data.application);
      } else if (appRes.data?.status === 'rejected') {
        await supabase.auth.signOut();
        setRejectedApp(appRes.data.application);
      } else {
        // User profile check
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.role === 'restaurant') {
          navigate('/restaurant/dashboard');
        } else {
          await supabase.auth.signOut();
          setError("No registered kitchen found for this account. Have you applied yet? Click 'Become a Partner with Zaika' below to register.");
        }
      }
    } catch (err) {
      console.error("Restaurant check error:", err);
      setError("An unexpected error occurred while verifying your kitchen credentials.");
    } finally {
      setLoading(false);
    }
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
        
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-xs">
            <ChefHat className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl text-[#191411]">Kitchen Partner Portal</h2>
          <p className="text-xs text-[#6E6157]">Manage incoming orders, prep queues, and menu availability</p>
        </div>

        {/* Highlighted Partner Sign Up Link */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-950">New to ZaikaPulse?</p>
              <p className="text-[11px] text-amber-800">List your kitchen and start receiving orders</p>
            </div>
          </div>
          <Link
            to="/restaurant/register"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black rounded-xl shadow-xs transition-colors shrink-0"
          >
            Become a Partner
          </Link>
        </div>

        {/* State 1: Application Under Review Modal / Card */}
        {underReviewApp && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3.5 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[11px]">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Application Under Review</span>
            </div>
            <p className="leading-relaxed">
              Your kitchen application for <strong className="text-stone-900">{underReviewApp.restaurant_name}</strong> is currently being reviewed by our administrative team.
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-amber-200 space-y-1 text-[11px] font-medium">
              <div><span className="text-stone-500">FSSAI License:</span> <span className="font-mono font-bold text-stone-800">{underReviewApp.fssai_license}</span></div>
              <div><span className="text-stone-500">Submitted:</span> {new Date(underReviewApp.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div><span className="text-stone-500">Turnaround SLA:</span> <span className="font-bold text-emerald-700">24 – 48 Hours</span></div>
            </div>
            <p className="text-[11px] text-stone-600">
              Once an administrator approves your culinary credentials and FSSAI license, your kitchen console will be instantly activated.
            </p>
            <button
              onClick={() => setUnderReviewApp(null)}
              className="w-full py-2 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-center cursor-pointer transition-colors"
            >
              Dismiss Notice
            </button>
          </div>
        )}

        {/* State 2: Application Rejected Card */}
        {rejectedApp && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-3.5 text-xs text-rose-950">
            <div className="flex items-center gap-2 font-black text-rose-800 uppercase tracking-wider text-[11px]">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Application Needs Revision</span>
            </div>
            <p className="leading-relaxed">
              Your application for <strong className="text-stone-900">{rejectedApp.restaurant_name}</strong> was not approved due to the following reason:
            </p>
            <div className="bg-white/90 rounded-xl p-3 border border-rose-200 font-semibold text-rose-800 text-xs">
              "{rejectedApp.rejection_reason || 'Compliance details or FSSAI verification could not be validated.'}"
            </div>
            <p className="text-[11px] text-stone-600">
              You may update your details and resubmit for immediate re-evaluation.
            </p>
            <div className="flex gap-2">
              <Link
                to="/restaurant/register"
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-center transition-colors"
              >
                Update & Re-apply
              </Link>
              <button
                onClick={() => setRejectedApp(null)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>{error}</div>
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
