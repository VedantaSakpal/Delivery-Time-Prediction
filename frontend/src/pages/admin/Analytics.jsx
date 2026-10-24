import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Loader2,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [ordersOlap, setOrdersOlap] = useState(null);
  const [granularity, setGranularity] = useState('day'); // 'day' | 'week' | 'month'
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'predictions'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          ordersOlapRes,
          response,
          timeResponse,
          weatherResponse,
          trafficResponse
        ] = await Promise.allSettled([
          api.get('/olap/orders'),
          api.get('/analytics/'),
          api.post('/olap/', {
            dimensions: ['time'],
            filters: {},
            time_granularity: 'day'
          }),
          api.post('/olap/', {
            dimensions: ['weather'],
            filters: {},
            time_granularity: 'day'
          }),
          api.post('/olap/', {
            dimensions: ['traffic_level'],
            filters: {},
            time_granularity: 'day'
          })
        ]);

        if (ordersOlapRes.status === 'fulfilled') {
          setOrdersOlap(ordersOlapRes.value.data);
        }

        setData({
          overview: response.status === 'fulfilled' ? response.value.data : null,
          timeTrend: timeResponse.status === 'fulfilled' ? timeResponse.value.data.results : [],
          weatherData: weatherResponse.status === 'fulfilled' ? weatherResponse.value.data.results : [],
          trafficData: trafficResponse.status === 'fulfilled' ? trafficResponse.value.data.results : []
        });
      } catch (err) {
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Current granularity dataset for orders & revenue
  const currentOrdersData =
    granularity === 'day'
      ? ordersOlap?.by_day || []
      : granularity === 'week'
      ? ordersOlap?.by_week || []
      : ordersOlap?.by_month || [];

  const totalRevenue = ordersOlap?.kpis?.total_revenue || 0;

  return (
    <div className="space-y-6">
      {/* Header and Section Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics & OLAP Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Multidimensional slice & dice for Orders, Revenue, and Delivery Predictions
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag size={16} />
            Orders & Revenue OLAP
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'predictions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={16} />
            Prediction & Fleet OLAP
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: ORDERS & REVENUE OLAP ===================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Top Granularity Selector & Context */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Time-Series Rollup / Drilldown</h4>
                <p className="text-xs text-slate-500">Group total orders and gross revenue by time interval</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setGranularity('day')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  granularity === 'day'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                By Day
              </button>
              <button
                onClick={() => setGranularity('week')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  granularity === 'week'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                By Week
              </button>
              <button
                onClick={() => setGranularity('month')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  granularity === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                By Month
              </button>
            </div>
          </div>

          {/* Orders & Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                    {ordersOlap?.kpis?.total_orders || 0}
                  </h3>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                    <ArrowUpRight size={14} /> Across all restaurants
                  </span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <ShoppingBag size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                    ${(ordersOlap?.kpis?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 mt-1 block">Gross platform volume</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Order Value</p>
                  <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">
                    ₹{(ordersOlap?.kpis?.avg_order_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 mt-1 block">Mean basket size</span>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {granularity === 'day' ? 'Active Days' : granularity === 'week' ? 'Active Weeks' : 'Active Months'}
                  </p>
                  <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                    {currentOrdersData.length}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 mt-1 block">Recorded time buckets</span>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Layers size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Orders & Revenue Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Total Orders Trend */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Total Orders ({granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'})
                  </h3>
                  <p className="text-xs text-slate-500">Order count distribution across time periods</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                  Count
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentOrdersData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [val, 'Total Orders']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                    />
                    <Bar dataKey="total_orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Total Revenue Trend */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Total Revenue ($) ({granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'})
                  </h3>
                  <p className="text-xs text-slate-500">Gross revenue generated across time periods</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  Revenue ($)
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentOrdersData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Revenue']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_revenue"
                      name="Revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* OLAP Aggregation Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  OLAP Aggregation Matrix — Total Orders & Revenue by {granularity.charAt(0).toUpperCase() + granularity.slice(1)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated metrics calculated directly from database order records
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full uppercase">
                {granularity}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-6">Period ({granularity.toUpperCase()})</th>
                    <th className="py-3 px-6 text-center">Total Orders</th>
                    <th className="py-3 px-6 text-right">Total Revenue</th>
                    <th className="py-3 px-6 text-right">Avg Order Value</th>
                    <th className="py-3 px-6 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {currentOrdersData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No order records available for this period.
                      </td>
                    </tr>
                  ) : (
                    currentOrdersData.map((row, idx) => {
                      const share = totalRevenue > 0 ? (row.total_revenue / totalRevenue) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-6 font-semibold text-slate-800 font-mono">
                            {row.period}
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full text-xs">
                              {row.total_orders} {row.total_orders === 1 ? 'order' : 'orders'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right font-bold text-emerald-600">
                            ₹{Number(row.total_revenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-6 text-right font-medium text-slate-700">
                            ₹{Number(row.avg_order_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-10 text-right">
                                {share.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PREDICTION & FLEET OLAP ===================== */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-medium">Avg Prep Time</p>
              <p className="text-2xl font-bold text-slate-800">{data?.overview?.average_preparation_time || 0} min</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-medium">Avg Distance</p>
              <p className="text-2xl font-bold text-slate-800">{data?.overview?.average_distance || 0} km</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-medium">Avg Courier Exp</p>
              <p className="text-2xl font-bold text-slate-800">{data?.overview?.average_courier_experience || 0} yrs</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
              <p className="text-sm text-slate-500 font-medium">Total Volume</p>
              <p className="text-2xl font-bold text-slate-800">{data?.overview?.prediction_count || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1 - Time Trend (Line) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Prediction Trend (Time)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.timeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time_dim" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="prediction_count" name="Count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 - Average Delivery Time (Time) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Avg Delivery Time (Time)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.timeTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time_dim" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg_delivery_time" name="Avg Time (min)" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3 - Weather Analysis (Bar) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Weather Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.weatherData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="weather" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_delivery_time" name="Avg Time (min)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4 - Traffic Analysis (Pie) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Traffic Impact (Avg Time)</h3>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.trafficData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="avg_delivery_time"
                      nameKey="traffic_level"
                    >
                      {data?.trafficData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
