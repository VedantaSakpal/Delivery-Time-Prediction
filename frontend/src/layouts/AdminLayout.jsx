import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { LayoutDashboard, Users, FileText, PieChart, Database, LogOut, Store, ShoppingBag, Flame, Activity, Layers, Cpu } from 'lucide-react';

const AdminLayout = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Fleet Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Data Warehouse & Mining', path: '/admin/warehouse', icon: Database },
    { name: 'OLAP Analytics', path: '/admin/analytics', icon: PieChart },
    { name: 'Executive Reports (PDF)', path: '/admin/reports', icon: FileText },
    { name: 'Live Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Kitchen Partners', path: '/admin/restaurants', icon: Store },
    { name: 'Users & Roles', path: '/admin/users', icon: Users },
    { name: 'Prediction Logs', path: '/admin/predictions', icon: Activity },
    { name: 'ML Model Telemetry', path: '/admin/model', icon: Cpu },
  ];

  return (
    <div className="flex h-screen bg-[#FAF7F2] text-[#191411]">
      {/* Dark Espresso Fleet Sidebar */}
      <div className="w-64 bg-[#191411] flex flex-col text-white border-r border-stone-800 shadow-md">
        <div className="h-20 flex items-center px-6 border-b border-stone-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white">
                Zaika<span className="text-orange-500">Pulse</span>
              </span>
              <p className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">Fleet Master</p>
            </div>
          </Link>
        </div>
        
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
                    ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/25' 
                    : 'text-stone-400 hover:bg-stone-800/60 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-stone-400'} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-10 h-10 rounded-full bg-orange-600/30 border border-orange-500/50 flex items-center justify-center text-orange-400 font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'Fleet Administrator'}</p>
              <p className="text-[11px] text-stone-400 truncate">System Operator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 bg-stone-800/80 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#FAF7F2] flex flex-col">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#ECE4D8] flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Platform Control</span>
            <h1 className="text-xl font-display font-extrabold text-[#191411] capitalize">
              {location.pathname.split('/').pop().replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-stone-900 text-stone-300 px-3 py-1.5 rounded-lg border border-stone-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ML Node: Online (Port 8000)</span>
          </div>
        </header>

        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
