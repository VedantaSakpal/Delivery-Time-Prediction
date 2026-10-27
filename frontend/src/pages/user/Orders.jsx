import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import {
  Clock, MapPin, Package, CheckCircle2, Truck, AlertTriangle,
  Store, RefreshCw, ChefHat, Bike, Sparkles
} from 'lucide-react';
import FreshnessGauge from '../../components/FreshnessGauge';
import StagedDispatchWidget from '../../components/StagedDispatchWidget';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const STATUS_CONFIG = {
  pending:          { bg: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Order Placed',      icon: Clock,    step: 0 },
  accepted:         { bg: 'bg-blue-100 text-blue-800 border-blue-200',       label: 'Kitchen Accepted',  icon: Store,    step: 1 },
  preparing:        { bg: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Chef Preparing',    icon: ChefHat,  step: 2 },
  ready:            { bg: 'bg-teal-100 text-teal-800 border-teal-200',       label: 'Packed & Ready',    icon: Package,  step: 2 },
  out_for_delivery: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Out for Delivery',  icon: Bike,     step: 3 },
  delivered:        { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Delivered',      icon: CheckCircle2, step: 4 },
  completed:        { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Delivered',      icon: CheckCircle2, step: 4 },
  rejected:         { bg: 'bg-rose-100 text-rose-800 border-rose-200',       label: 'Cancelled',        icon: AlertTriangle, step: -1 },
};

const STEPS = [
  { key: 'pending',          label: 'Placed',    icon: Clock },
  { key: 'accepted',         label: 'Accepted',  icon: Store },
  { key: 'preparing',        label: 'Preparing', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Transit',   icon: Bike },
  { key: 'delivered',        label: 'Delivered', icon: CheckCircle2 },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const pollingRef = useRef(null);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      const res = await axios.get(`${API_URL}/api/orders/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Supabase Realtime channel subscription
    const channel = supabase
      .channel('orders-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime order status push:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    // 2. High-frequency polling (3.5 seconds) to catch restaurant status updates seamlessly
    pollingRef.current = setInterval(() => {
      fetchOrders();
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeOrdersCount = orders.filter(
    o => !['delivered', 'completed', 'rejected'].includes(o.status)
  ).length;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header with Realtime status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-3xl text-[#191411]">My justwoww Orders</h1>
            {activeOrdersCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-600 text-white shadow-xs animate-pulse">
                {activeOrdersCount} Active
              </span>
            )}
          </div>
          <p className="text-xs text-[#6E6157]">
            Real-time status updates sync automatically when kitchen partners accept, cook, and dispatch orders.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
              Synced: {lastSyncTime}
            </span>
          )}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-[#191411] font-bold text-xs rounded-xl border border-[#ECE4D8] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Orders'}</span>
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#ECE4D8] space-y-3 shadow-xs">
          <p className="text-sm text-[#6E6157]">You haven't placed any orders yet.</p>
          <a href="/user/restaurants" className="inline-block px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
            Browse Indian Kitchens
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const pred = order.predictions?.[0];
            const cfg = STATUS_CONFIG[order.status] || {
              bg: 'bg-stone-100 text-stone-800 border-stone-200',
              label: order.status,
              icon: Clock,
              step: 0,
            };
            const StatusIcon = cfg.icon;
            const currentStep = cfg.step;
            const isActive = !['delivered', 'completed', 'rejected'].includes(order.status);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl shadow-xs border overflow-hidden transition-all ${
                  isActive ? 'border-2 border-orange-300 ring-2 ring-orange-100 shadow-md' : 'border-[#ECE4D8]'
                }`}
              >
                {/* Header */}
                <div className={`p-5 border-b border-[#ECE4D8] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  isActive ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50' : 'bg-[#FAF7F2]'
                }`}>
                  <div className="flex items-center gap-4">
                    {order.restaurants?.image_url ? (
                      <img src={order.restaurants.image_url} alt="restaurant" className="w-12 h-12 rounded-2xl object-cover border border-[#ECE4D8]" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center">
                        <Store className="w-6 h-6 text-stone-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-black text-lg text-[#191411]">{order.restaurants?.name || 'Kitchen Partner'}</h3>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <p className="text-xs text-[#938376]">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${cfg.bg}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{cfg.label}</span>
                    </span>
                    <p className="font-display font-black text-xl text-[#191411]">₹{order.total_amount}</p>
                  </div>
                </div>

                {/* Realtime Stepper for Active Orders */}
                {isActive && (
                  <div className="px-6 pt-5 pb-3 border-b border-[#ECE4D8] bg-white">
                    <div className="relative mb-3">
                      <div className="absolute top-3.5 left-5 right-5 h-1 bg-stone-200 -z-0 rounded-full" />
                      <div
                        className="absolute top-3.5 left-5 h-1 bg-gradient-to-r from-orange-500 to-amber-500 -z-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${(Math.max(0, currentStep) / (STEPS.length - 1)) * 100}%`
                        }}
                      />
                      <div className="relative z-10 flex justify-between">
                        {STEPS.map((s, idx) => {
                          const IconComp = s.icon;
                          const isDone = currentStep > idx;
                          const isCurr = currentStep === idx;

                          let circleStyle = 'bg-stone-100 text-stone-400 border-2 border-stone-200';
                          if (isDone) {
                            circleStyle = 'bg-emerald-500 text-white border-2 border-emerald-500';
                          } else if (isCurr) {
                            circleStyle = 'bg-orange-600 text-white border-4 border-orange-200 ring-2 ring-orange-500 animate-pulse';
                          }

                          return (
                            <div key={s.key} className="flex flex-col items-center text-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${circleStyle}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-[10px] font-bold mt-1 ${isCurr ? 'text-orange-600' : isDone ? 'text-emerald-700' : 'text-stone-400'}`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 flex flex-col lg:flex-row gap-6">
                  {/* Order Details */}
                  <div className="flex-1 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#938376]">Order Items</h4>
                    <ul className="text-xs space-y-2">
                      {order.order_items?.map(item => (
                        <li key={item.id} className="text-[#4A3C34] flex justify-between font-medium">
                          <span>{item.quantity}× {item.menu_items?.name || 'Item'}</span>
                          <span className="font-mono text-stone-500">₹{(item.price_at_time * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#6E6157] flex items-center gap-1.5 pt-2 border-t border-[#ECE4D8]">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{order.delivery_address}</span>
                    </p>
                  </div>

                  {/* ML Prediction Panel */}
                  {pred && (
                    <div className="flex-1 bg-[#FAF7F2] p-5 rounded-2xl border border-[#ECE4D8] space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <h4 className="font-display font-bold text-xs text-[#191411]">justwoww ETA Forecast</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl shadow-xs border border-[#ECE4D8]">
                          <p className="text-[11px] text-[#938376] font-bold uppercase mb-0.5">Expected In</p>
                          <p className="text-xl font-display font-black text-orange-600">{pred.predicted_delivery_time_min} <span className="text-xs font-normal text-[#6E6157]">mins</span></p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-xs border border-[#ECE4D8]">
                          <p className="text-[11px] text-[#938376] font-bold uppercase mb-0.5">Range</p>
                          <p className="text-base font-bold text-[#191411]">{pred.prediction_range_lower} – {pred.prediction_range_upper} <span className="text-xs font-normal text-[#6E6157]">mins</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="font-bold uppercase tracking-wider text-[#938376] text-[10px]">Reliability:</span>
                        {pred.reliability === 'High' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">High Confidence</span>}
                        {pred.reliability === 'Medium' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Medium</span>}
                        {pred.reliability === 'Low' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low</span>}
                      </div>

                      {pred.explanation && pred.explanation.length > 0 && (
                        <div className="pt-2 border-t border-[#ECE4D8]">
                          <p className="text-[11px] font-bold text-[#938376] mb-1.5 uppercase tracking-wider">Top Transit Factors:</p>
                          <div className="space-y-1">
                            {pred.explanation.slice(0, 3).map((exp, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-[#6E6157]">{exp.feature}</span>
                                <span className={`font-mono font-bold ${exp.impact > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                                  {exp.impact > 0 ? "+" : ""}{exp.impact.toFixed(1)}m
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Staged Dispatch Zero-Idle Synchronizer */}
                {order.staged_dispatch && (
                  <div className="px-5 pb-4">
                    <StagedDispatchWidget
                      stagedData={order.staged_dispatch}
                      userRole="user"
                      compact={!isActive}
                    />
                  </div>
                )}

                {/* AI Food Freshness & Quality Assurance Gauge */}
                {order.freshness_assessment && (
                  <div className="px-5 pb-5">
                    <FreshnessGauge
                      freshnessData={order.freshness_assessment}
                      hasThermalPackaging={order.has_thermal_packaging || order.freshness_assessment?.has_thermal_packaging}
                      showToggle={false}
                      compact={!isActive}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
