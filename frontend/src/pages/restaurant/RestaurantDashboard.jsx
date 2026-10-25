import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Store, Clock, CheckCircle, Truck, XCircle,
  BarChart2, ShoppingBag, TrendingUp, DollarSign, Package, FileText
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import OperationsReportView from '../../components/OperationsReportView';

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
  const [data,      setData]      = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('orders'); // 'orders' | 'analytics'
  const [error,     setError]     = useState(null);

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

  const pendingOrders    = data?.orders?.filter(o => o.status === 'pending') || [];
  const activeOrders     = data?.orders?.filter(o => !['delivered','rejected'].includes(o.status) && o.status !== 'pending') || [];
  const completedOrders  = data?.orders?.filter(o => o.status === 'delivered') || [];

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
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Pending',   value: pendingOrders.length,   color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Active',    value: activeOrders.length,    color: 'bg-blue-50 text-blue-700'     },
            { label: 'Delivered', value: completedOrders.length, color: 'bg-green-50 text-green-700'   },
          ].map(s => (
            <div key={s.label} className={`${s.color} px-4 py-2 rounded-xl text-center min-w-[72px]`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
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
        <div className="space-y-6">
          {/* Pending (needs action) */}
          {pendingOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" /> New Orders
                <span className="ml-1 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
              </h2>
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} updateOrderStatus={updateOrderStatus} />
                ))}
              </div>
            </section>
          )}

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" /> Active Orders
              </h2>
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} updateOrderStatus={updateOrderStatus} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Completed Orders
              </h2>
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <OrderCard key={order.id} order={order} updateOrderStatus={updateOrderStatus} />
                ))}
              </div>
            </section>
          )}

          {data?.orders?.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-14 text-center">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No orders yet. They'll appear here when customers order.</p>
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
        </div>
      </div>
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
