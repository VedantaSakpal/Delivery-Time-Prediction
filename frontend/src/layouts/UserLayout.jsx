import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { LayoutDashboard, Clock, History, User, LogOut, Store, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import Logo from '../components/Logo';


const UserLayout = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Browse Eateries', path: '/user/restaurants', icon: Store },
    { name: 'My Orders', path: '/user/orders', icon: ShoppingBag },
    { name: 'AI Predictor', path: '/user/predict', icon: Clock },
    { name: 'History', path: '/user/history', icon: History },
    { name: 'Profile', path: '/user/profile', icon: User },
  ];

  const currentTitle = {
    dashboard: 'Culinary Overview',
    restaurants: 'Curated Eateries',
    orders: 'Order Tracking & History',
    predict: 'AI Delivery Time Predictor',
    history: 'Prediction Log',
    profile: 'User Profile & Preferences'
  }[location.pathname.split('/').pop()] || 'Diner Portal';

  return (
    <div className="flex h-screen bg-[#FAF7F2] text-[#191411]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[#ECE4D8] flex flex-col shadow-sm">
        
        {/* Brand Bar */}
        <div className="h-20 flex items-center px-6 border-b border-[#ECE4D8]">
          <Logo size="sm" tagline="Diner Portal" to="/" />
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 py-6 flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-orange-50 text-orange-700 font-bold border-l-4 border-orange-600 shadow-xs' 
                    : 'text-[#6E6157] hover:bg-[#FAF7F2] hover:text-[#191411]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-orange-600' : 'text-[#938376]'} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#ECE4D8] bg-[#FAF7F2]/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#191411] truncate">{profile?.full_name || 'Diner Guest'}</p>
              <p className="text-xs text-[#6E6157] truncate">{profile?.email || 'diner@justwoww.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto bg-[#FAF7F2] flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#ECE4D8] flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Portal / Customer</span>
            <h1 className="text-xl font-display font-extrabold text-[#191411]">
              {currentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell role="user" />

            <Link
              to="/user/predict"
              className="px-3.5 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5"
            >

              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Instant ETA Estimator
            </Link>
            <Link
              to="/user/restaurants"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              Order Food
            </Link>
          </div>
        </header>

        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
