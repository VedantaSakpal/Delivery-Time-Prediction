import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Store } from 'lucide-react';

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

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'restaurant') {
        await supabase.auth.signOut();
        setError('This portal is only for restaurant accounts. Please use the regular login.');
      } else {
        navigate('/restaurant/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-slate-100 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Restaurant Portal</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage your restaurant & orders</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="restaurant@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in as Restaurant'}
          </button>
        </form>

        <div className="text-center text-sm space-y-1">
          <p className="text-slate-500">
            Not a restaurant?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">User Login</Link>
          </p>
          <p className="text-slate-500">
            Admin?{' '}
            <Link to="/admin/login" className="font-medium text-blue-600 hover:text-blue-500">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
