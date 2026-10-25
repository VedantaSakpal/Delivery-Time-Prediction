import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Store, LogOut, LayoutDashboard, Flame, ChefHat, Sparkles } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function RestaurantLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Kitchen Dashboard', path: '/restaurant/dashboard', icon: LayoutDashboard }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] flex">
      {/* Merchant Sidebar */}
      <aside className="w-64 bg-amber-950 text-white flex flex-col border-r border-amber-900 shadow-md">
        <div className="h-20 flex items-center px-6 border-b border-amber-900">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white">
                Zaika<span className="text-amber-400">Pulse</span>
              </span>
              <p className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">Kitchen Partner</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/25' 
                        : 'text-amber-200/70 hover:bg-amber-900/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-amber-900 bg-amber-900/40">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-xs font-bold text-red-300 hover:text-white w-full px-3 py-2 rounded-xl bg-amber-900/70 hover:bg-red-950 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[#FAF7F2] flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#ECE4D8] flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Kitchen Operations</span>
            <h1 className="text-xl font-display font-extrabold text-[#191411]">
              Live Order Dispatch & Kitchen Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell role="restaurant" />
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

