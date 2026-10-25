import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../utils/supabase';
import {
  Clock, MapPin, Package, CheckCircle2, Truck, AlertTriangle,
  Store, RefreshCw, ChefHat, Bike, Flame, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const STEPS = [
  { key: 'pending',          label: 'Order Placed',      icon: Clock,    desc: 'Waiting for kitchen' },
  { key: 'accepted',         label: 'Kitchen Accepted',  icon: Store,    desc: 'Order confirmed' },
  { key: 'preparing',        label: 'Chef Preparing',    icon: ChefHat,  desc: 'Cooking fresh' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: Bike,     desc: 'Rider on the road' },
  { key: 'delivered',        label: 'Delivered',         icon: CheckCircle2, desc: 'Enjoy your food!' },
];

function getStepIndex(status) {
  switch (status) {
    case 'pending': return 0;
    case 'accepted': return 1;
    case 'preparing': return 2;
    case 'ready': return 2; // treat ready as preparing/packaged stage
    case 'out_for_delivery': return 3;
    case 'delivered':
    case 'completed': return 4;
    case 'rejected': return -1;
    default: return 0;
  }
}

export default function ActiveOrderTracker({ onOrdersUpdate }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const pollingRef = useRef(null);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setSyncing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/orders/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allOrders = res.data.orders || [];
      if (onOrdersUpdate) {
        onOrdersUpdate(allOrders);
      }

      // Filter for active orders
      const active = allOrders.filter(
        o => !['delivered', 'completed', 'rejected'].includes(o.status)
      );
      setActiveOrders(active);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching active orders:', err);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setSyncing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Setup Supabase Realtime channel for instant push updates
    const channel = supabase
      .channel('realtime-orders-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime order change event received:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    // 2. High-frequency auto-polling fallback every 3.5 seconds
    pollingRef.current = setInterval(() => {
      fetchOrders();
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return null;
  }

  if (activeOrders.length === 0) {
    return null; // Don't show tracker if there are no active orders
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="font-display font-black text-xl text-[#191411]">
            Live Delivery Tracking ({activeOrders.length} Active)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
              Live synced: {lastSyncTime}
            </span>
          )}
          <button
            onClick={() => fetchOrders(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ECE4D8] bg-white hover:bg-orange-50 text-stone-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Refresh order status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activeOrders.map((order) => {
          const currentStep = getStepIndex(order.status);
          const isReady = order.status === 'ready';

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl border-2 border-orange-300 shadow-md overflow-hidden transition-all"
            >
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-5 border-b border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {order.restaurants?.image_url ? (
                    <img
                      src={order.restaurants.image_url}
                      alt={order.restaurants.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-orange-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Store className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-base text-[#191411]">
                        {order.restaurants?.name || 'Kitchen Partner'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                        Order #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="truncate max-w-xs">{order.delivery_address}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                      {isReady ? '🍽️ Packed & Ready' : order.status.replace('_', ' ')}
                    </span>
                    <p className="font-display font-black text-lg text-[#191411] mt-0.5">
                      ₹{order.total_amount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-Time Stepper */}
              <div className="p-6 space-y-6">
                <div className="relative">
                  {/* Connecting Track */}
                  <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0 rounded-full" />
                  <div
                    className="absolute top-4 left-6 h-1 bg-gradient-to-r from-orange-500 to-amber-500 -z-0 rounded-full transition-all duration-700"
                    style={{
                      width: `${(Math.max(0, currentStep) / (STEPS.length - 1)) * 100}%`
                    }}
                  />

                  {/* Steps */}
                  <div className="relative z-10 flex justify-between">
                    {STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompleted = currentStep > idx;
                      const isCurrent = currentStep === idx;

                      let circleClass = 'bg-stone-100 text-stone-400 border-2 border-stone-200';
                      if (isCompleted) {
                        circleClass = 'bg-emerald-500 text-white border-2 border-emerald-500 shadow-sm';
                      } else if (isCurrent) {
                        circleClass = 'bg-orange-600 text-white border-4 border-orange-200 ring-2 ring-orange-500 shadow-md animate-pulse';
                      }

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center max-w-[80px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <p className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-emerald-700' : 'text-stone-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] text-stone-400 hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Callout Banner */}
                <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
                      {currentStep === 0 && <Clock className="w-5 h-5 animate-spin" />}
                      {currentStep === 1 && <Store className="w-5 h-5" />}
                      {currentStep === 2 && <ChefHat className="w-5 h-5 animate-bounce" />}
                      {currentStep === 3 && <Bike className="w-5 h-5" />}
                      {currentStep === 4 && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-orange-900">
                        {currentStep === 0 && 'Order Placed — Kitchen Notified'}
                        {currentStep === 1 && 'Order Accepted — Preparing Ingredients'}
                        {currentStep === 2 && (isReady ? 'Dish Ready & Packed — Waiting for Rider Pickup' : 'Chef Cooking Fresh in the Kitchen')}
                        {currentStep === 3 && 'Rider on the Way to Your Delivery Address'}
                        {currentStep === 4 && 'Delivered! Bon Appétit'}
                      </p>
                      <p className="text-[11px] text-orange-700/80">
                        Live updates from the restaurant partner reflect instantly here.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/user/orders"
                    className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl border border-orange-200 transition-colors shrink-0"
                  >
                    View in Orders
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
