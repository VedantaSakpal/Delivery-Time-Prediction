import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Store, Clock, CheckCircle, Truck, XCircle,
  BarChart2, ShoppingBag, TrendingUp, DollarSign, Package, FileText,
  Calendar, Filter
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import OperationsReportView from '../../components/OperationsReportView';
import FreshnessGauge from '../../components/FreshnessGauge';
import StagedDispatchWidget from '../../components/StagedDispatchWidget';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted:         'bg-blue-100 text-blue-700 border-blue-200',
  preparing:        'bg-orange-100 text-orange-700 border-orange-200',
  ready:            'bg-teal-100 text-teal-700 border-teal-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:        'bg-green-100 text-green-700 border-green-200',
  rejected:         'bg-red-100 text-red-700 border-red-200',
};

const PIE_COLORS = ['#f59e0b','#3b82f6','#f97316','#14b8a6','#6366f1','#22c55e','#ef4444'];

export default function RestaurantDashboard() {
  const [data,            setData]            = useState(null);
  const [analytics,       setAnalytics]       = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState('orders'); // 'orders' | 'analytics' | 'reports'
  const [orderStatusTab,  setOrderStatusTab]  = useState('active'); // 'active' | 'completed' | 'declined' | 'all'
  const [orderDateFilter, setOrderDateFilter] = useState('all');    // 'all' | 'today' | 'yesterday' | 'this_month'
  const [error,           setError]           = useState(null);

  const getToken = async () => {
    const { data: session } = await supabase.auth.getSession();
    return session?.session?.access_token;
  };

  const fetchDashboard = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/restaurants/me/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/restaurants/me/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = await getToken();
      await axios.patch(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
      fetchAnalytics();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;

  // Date Filtering Helper
  const filterByDate = (order, dateFilter) => {
    if (dateFilter === 'all') return true;
    if (!order.created_at) return true;
    const orderDate = new Date(order.created_at);
    const now = new Date();

    if (dateFilter === 'today') {
      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }

    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return (
        orderDate.getDate() === yesterday.getDate() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getFullYear() === yesterday.getFullYear()
      );
    }

    if (dateFilter === 'this_month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }

    return true;
  };

  const allOrders = data?.orders || [];
  const dateFilteredOrders = allOrders.filter(o => filterByDate(o, orderDateFilter));

  const activeOrdersList    = dateFilteredOrders.filter(o => !['delivered', 'completed', 'rejected', 'cancelled'].includes(o.status));
  const pendingOrdersList   = activeOrdersList.filter(o => o.status === 'pending');
  const kitchenOrdersList   = activeOrdersList.filter(o => o.status !== 'pending');
  const completedOrdersList = dateFilteredOrders.filter(o => ['delivered', 'completed'].includes(o.status));
  const declinedOrdersList  = dateFilteredOrders.filter(o => ['rejected', 'cancelled'].includes(o.status));

  let displayedOrders = [];
  if (orderStatusTab === 'active') {
    displayedOrders = [...pendingOrdersList, ...kitchenOrdersList];
  } else if (orderStatusTab === 'completed') {
    displayedOrders = completedOrdersList;
  } else if (orderStatusTab === 'declined') {
    displayedOrders = declinedOrdersList;
  } else {
    displayedOrders = dateFilteredOrders;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Store className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">{data?.restaurant?.name}</h1>
            <p className="text-sm text-slate-500">{data?.restaurant?.address}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2.5 flex-wrap">
          {[
            { label: 'Active',    tab: 'active',    value: allOrders.filter(o => !['delivered', 'completed', 'rejected', 'cancelled'].includes(o.status)).length, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
            { label: 'Pending',   tab: 'active',    value: allOrders.filter(o => o.status === 'pending').length,   color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
            { label: 'Delivered', tab: 'completed', value: allOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
            { label: 'Declined',  tab: 'declined',  value: allOrders.filter(o => ['rejected', 'cancelled'].includes(o.status)).length, color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
          ].map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setTab('orders');
                setOrderStatusTab(s.tab);
              }}
              className={`${s.color} px-3.5 py-1.5 rounded-xl text-center min-w-[70px] border transition-all cursor-pointer shadow-2xs`}
              title={`Switch to ${s.label} orders`}
            >
              <p className="text-lg font-black leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'orders',    label: 'Orders',                      icon: ShoppingBag },
          { key: 'analytics', label: 'Analytics',                   icon: BarChart2   },
          { key: 'reports',   label: 'Operations Reports (PDF)',   icon: FileText    },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="space-y-5">
          {/* Sub-navigation Controls: Status Tabs & Date Filter */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Status Segmented Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'active',    label: 'Active Orders', icon: Truck,       count: activeOrdersList.length,    badgeColor: pendingOrdersList.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700' },
                  { key: 'completed', label: 'Completed',     icon: CheckCircle, count: completedOrdersList.length, badgeColor: 'bg-emerald-100 text-emerald-800' },
                  { key: 'declined',  label: 'Declined',      icon: XCircle,     count: declinedOrdersList.length,  badgeColor: 'bg-rose-100 text-rose-800' },
                  { key: 'all',       label: 'All Orders',    icon: ShoppingBag, count: dateFilteredOrders.length,  badgeColor: 'bg-slate-200 text-slate-700' },
                ].map(st => {
                  const Icon = st.icon;
                  const isSelected = orderStatusTab === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setOrderStatusTab(st.key)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 ring-2 ring-orange-400/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{st.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white/25 text-white' : st.badgeColor
                      }`}>
                        {st.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Date Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" /> Filter:
                </span>
                {[
                  { key: 'all',        label: 'All Time' },
                  { key: 'today',      label: 'Today' },
                  { key: 'yesterday',  label: 'Yesterday' },
                  { key: 'this_month', label: 'This Month' },
                ].map(df => (
                  <button
                    key={df.key}
                    type="button"
                    onClick={() => setOrderDateFilter(df.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderDateFilter === df.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {df.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Context Summary Banner */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Showing {displayedOrders.length} {orderStatusTab} order{displayedOrders.length === 1 ? '' : 's'}
                </span>
                <span>•</span>
                <span className="capitalize">
                  Date Window: <strong className="text-slate-800">{orderDateFilter.replace('_', ' ')}</strong>
                </span>
              </div>

              {orderStatusTab === 'active' && pendingOrdersList.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  {pendingOrdersList.length} New Order{pendingOrdersList.length > 1 ? 's' : ''} Awaiting Kitchen Acceptance
                </span>
              )}

              {orderStatusTab === 'completed' && (
                <span className="text-emerald-700 font-bold">
                  Completed Revenue: ₹{completedOrdersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toLocaleString('en-IN')}
                </span>
              )}

              {orderStatusTab === 'declined' && (
                <span className="text-rose-700 font-bold">
                  {declinedOrdersList.length} Order{declinedOrdersList.length === 1 ? '' : 's'} Declined / Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Pending Action Urgent Banner if on Active tab and orders are waiting */}
          {orderStatusTab === 'active' && pendingOrdersList.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  🔔
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">Action Required</h4>
                  <p className="text-xs text-amber-900 font-medium">
                    You have <strong>{pendingOrdersList.length}</strong> new incoming order{pendingOrdersList.length > 1 ? 's' : ''}. Accept to initiate kitchen cooking and synchronized rider dispatch.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full shrink-0 hidden sm:inline-block">
                Top Priority
              </span>
            </div>
          )}

          {/* Orders Listing */}
          {displayedOrders.length > 0 ? (
            <div className="space-y-4">
              {displayedOrders.map(order => (
                <OrderCard key={order.id} order={order} updateOrderStatus={updateOrderStatus} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                {orderStatusTab === 'active' ? '🍳' : orderStatusTab === 'completed' ? '📦' : orderStatusTab === 'declined' ? '🚫' : '📋'}
              </div>
              <p className="text-sm font-bold text-slate-800">
                No {orderStatusTab} orders found {orderDateFilter !== 'all' ? `for ${orderDateFilter.replace('_', ' ')}` : ''}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {orderDateFilter !== 'all'
                  ? 'No orders in this status category match the selected date window. Switch to "All Time" to view all records.'
                  : 'New orders will automatically appear here in real time when placed by customers.'}
              </p>
              {orderDateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setOrderDateFilter('all')}
                  className="px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs rounded-xl border border-orange-200 transition-colors cursor-pointer"
                >
                  View All Time Orders
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <AnalyticsPanel analytics={analytics} />
      )}

      {/* ── REPORTS TAB (Day, Week, Month, Year & PDF) ── */}
      {tab === 'reports' && (
        <OperationsReportView userRole="restaurant" />
      )}
    </div>
  );
}

/* ─── OrderCard ─── */
function OrderCard({ order, updateOrderStatus }) {
  const statusClass = STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600 border-slate-200';
  const isActive = !['delivered', 'rejected'].includes(order.status);
  const [stagedData, setStagedData] = useState(order.staged_dispatch);

  useEffect(() => {
    setStagedData(order.staged_dispatch);
  }, [order.staged_dispatch]);

  const handleAdjustPrep = async (deltaMinutes) => {
    try {
      const currentPrep = stagedData?.prep_time_min || 18.0;
      const newPrep = Math.max(5, currentPrep + deltaMinutes);
      const res = await axios.post(`${API_URL}/api/predictions/staged-dispatch`, {
        prep_time_min: newPrep,
        courier_pickup_transit_min: stagedData?.courier_pickup_transit_min || 5.5,
        order_status: order.status
      });
      setStagedData(res.data);
    } catch (err) {
      console.error('Failed to adjust prep time sync:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div>
          <p className="font-bold text-slate-800 text-sm">Order #{order.id.slice(0, 8)}</p>
          <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
            {order.status.replace('_', ' ')}
          </span>
          <span className="font-bold text-orange-600 text-sm">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col sm:flex-row gap-6">
        {/* Customer & items */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">{order.profiles?.full_name}</p>
          <p className="text-xs text-slate-400 mb-2">{order.delivery_address}</p>
          <ul className="space-y-1">
            {order.order_items?.map(item => (
              <li key={item.id} className="text-sm text-slate-600">
                {item.quantity}× {item.menu_items?.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 min-w-[180px] justify-center">
          {order.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => updateOrderStatus(order.id, 'accepted')}
                className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                ✓ Accept
              </button>
              <button
                onClick={() => updateOrderStatus(order.id, 'rejected')}
                className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                ✗ Reject
              </button>
            </div>
          )}
          {order.status === 'accepted' && (
            <button onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
              🍳 Mark Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button onClick={() => updateOrderStatus(order.id, 'ready')}
              className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
              ✅ Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
              className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              🚴 Out for Delivery
            </button>
          )}
          {order.status === 'out_for_delivery' && (
            <button onClick={() => updateOrderStatus(order.id, 'delivered')}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              🎉 Mark Delivered
            </button>
          )}
          {order.status === 'delivered' && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Delivered Successfully</span>
            </div>
          )}
          {order.status === 'rejected' && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-200">
              <XCircle className="w-3.5 h-3.5" />
              <span>Declined by Kitchen</span>
            </div>
          )}
        </div>
      </div>

      {/* Decoupled Staged Dispatch Synchronization */}
      {stagedData && (
        <div className="px-5 pb-4">
          <StagedDispatchWidget
            stagedData={stagedData}
            userRole="restaurant"
            onAdjustPrepTime={handleAdjustPrep}
            compact={!isActive}
          />
        </div>
      )}

      {/* Food Freshness & Thermal Retention Assessment */}
      {order.freshness_assessment && (
        <div className="px-5 pb-4">
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
}

/* ─── Analytics Panel ─── */
function AnalyticsPanel({ analytics }) {
  if (!analytics) return (
    <div className="bg-white rounded-xl border p-12 text-center text-slate-400">
      Loading analytics...
    </div>
  );

  const PIE_COLORS_LIST = ['#f59e0b','#3b82f6','#f97316','#14b8a6','#6366f1','#22c55e','#ef4444'];

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',  value: analytics.total_orders,            icon: ShoppingBag,  color: 'bg-blue-50 text-blue-600'    },
          { label: 'Total Revenue', value: `₹${Number(analytics.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'This Month',    value: analytics.orders_by_month?.slice(-1)[0]?.order_count ?? 0, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
          { label: 'Menu Items',    value: analytics.top_items?.length ?? 0,   icon: Package,      color: 'bg-violet-50 text-violet-600' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${kpi.color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Month */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">📦 Orders by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.orders_by_month}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="order_count" name="Orders" fill="#f97316" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Month */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">💰 Revenue by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.revenue_by_month}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">📊 Orders by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={analytics.orders_by_status}
                dataKey="count"
                nameKey="status"
                cx="50%" cy="50%"
                outerRadius={90}
                label={({ status, count }) => `${status.replace('_',' ')}: ${count}`}
                labelLine={false}
              >
                {analytics.orders_by_status.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS_LIST[i % PIE_COLORS_LIST.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n.replace('_', ' ')]} />
              <Legend formatter={v => v.replace('_', ' ')} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Menu Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4">🏆 Top Menu Items</h3>
          {analytics.top_items?.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_items.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">#{i+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                      <span>{item.name}</span>
                      <span className="text-slate-400">{item.total_qty} sold · ₹{item.total_revenue}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-orange-400 rounded-full"
                        style={{ width: `${(item.total_qty / (analytics.top_items[0]?.total_qty || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
