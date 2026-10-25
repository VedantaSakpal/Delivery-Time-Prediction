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
  ArrowUpRight,
  Scale,
  Activity,
  Navigation,
  Banknote,
  CreditCard,
  Clock
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

  // Real Unit Economics & Basket Analytics extracted from live database
  const basketSegments = ordersOlap?.basket_segments || [];
  const timeWindows = ordersOlap?.time_windows || [];
  const paymentEconomics = ordersOlap?.payment_economics || [];
  const unitEconomics = ordersOlap?.unit_economics || {};

  const codRecord = paymentEconomics.find(
    (p) => p.payment_method === 'cash_on_delivery' || p.payment_method === 'cash'
  );
  const codShare = codRecord ? codRecord.volume_share : 0;
  const digitalShare = codRecord ? (100 - codShare).toFixed(1) : 0;

  const formatPaymentName = (method) => {
    if (!method) return 'Unknown';
    if (method === 'cash_on_delivery' || method === 'cash') return 'Cash on Delivery (COD)';
    if (method === 'card') return 'Credit / Debit Card';
    if (method === 'upi') return 'UPI (Instant)';
    return method.replace(/_/g, ' ').toUpperCase();
  };

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
                    ₹{(ordersOlap?.kpis?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    Total Revenue (₹) ({granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly'})
                  </h3>
                  <p className="text-xs text-slate-500">Gross revenue generated across time periods</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  Revenue (₹)
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

          {/* ======================================================== */}
          {/* Real Unit Economics & Order Basket Numbers (Option 4)    */}
          {/* ======================================================== */}
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="text-amber-600" size={20} />
                  Order Basket & Unit Economics Numbers
                </h3>
                <p className="text-xs text-slate-500">
                  Descriptive statistics, ticket size segmentation, and transit revenue efficiency derived from {ordersOlap?.kpis?.total_orders || 0} recorded orders
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Database Computed
              </span>
            </div>

            {/* 4 Statistical & Unit Economics Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Median Basket (P50)</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                      ₹{Number(unitEconomics.median_order_value || 0).toFixed(2)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Range: <span className="font-semibold text-slate-700">₹{Number(unitEconomics.min_order_value || 0).toFixed(2)}</span> – <span className="font-semibold text-slate-700">₹{Number(unitEconomics.max_order_value || 0).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Scale size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basket Std Dev (σ)</p>
                    <h3 className="text-2xl font-extrabold text-violet-700 mt-1">
                      ₹{Number(unitEconomics.std_dev_order_value || 0).toFixed(2)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Coeff. of Var:{' '}
                      <span className="font-semibold text-slate-700">
                        {ordersOlap?.kpis?.avg_order_value
                          ? ((unitEconomics.std_dev_order_value / ordersOlap.kpis.avg_order_value) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </p>
                  </div>
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <Activity size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue / Transit Km</p>
                    <h3 className="text-2xl font-extrabold text-sky-600 mt-1">
                      ₹{Number(unitEconomics.revenue_per_km || 0).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/km</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Avg distance:{' '}
                      <span className="font-semibold text-slate-700">{unitEconomics.avg_distance_km || 0} km</span>
                    </p>
                  </div>
                  <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                    <Navigation size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash vs Digital</p>
                    <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {codShare}% <span className="text-xs text-slate-400 font-normal">COD</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Digital Share:{' '}
                      <span className="font-semibold text-emerald-700">{digitalShare}%</span>
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Banknote size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Deep-Dive Grid: Basket Segmentation & Operational Windows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basket Size Segmentation */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-blue-600" />
                        Ticket Size Segmentation
                      </h4>
                      <p className="text-xs text-slate-500">Distribution of orders across ticket value tiers</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {ordersOlap?.kpis?.total_orders || 0} Orders Total
                    </span>
                  </div>

                  <div className="space-y-4">
                    {basketSegments.map((seg, idx) => {
                      const colors = [
                        { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
                        { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
                        { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' }
                      ][idx % 3];

                      return (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                                {seg.segment}
                              </span>
                              <span className="text-xs font-medium text-slate-500">({seg.range})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-800">
                                {seg.order_count} orders
                              </span>
                              <span className="text-xs text-slate-400 ml-1.5 font-medium">
                                ({seg.volume_share}%)
                              </span>
                            </div>
                          </div>

                          {/* Progress bar comparing volume share */}
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden my-2">
                            <div
                              className={`${colors.bar} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${seg.volume_share}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                            <div>
                              Gross Volume: <span className="font-bold text-emerald-700">₹{Number(seg.total_revenue).toFixed(2)}</span>
                              <span className="text-slate-400 ml-1">({seg.revenue_share}% GMV)</span>
                            </div>
                            <div>
                              Mean Basket: <span className="font-bold text-slate-800">₹{Number(seg.avg_basket_value).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Operational Demand & Rush Windows */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={18} className="text-amber-600" />
                        Operational Demand Windows
                      </h4>
                      <p className="text-xs text-slate-500">Real transaction volume by time of day</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full">
                      24h Clock
                    </span>
                  </div>

                  <div className="space-y-3">
                    {timeWindows.map((tw, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">
                            {tw.window}
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-bold text-blue-700">
                              {tw.order_count} orders
                            </span>
                            <span className="text-xs text-slate-400 ml-1">({tw.volume_share}%)</span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden my-1.5">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full"
                            style={{ width: `${tw.volume_share}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                          <span>
                            Revenue: <span className="font-semibold text-slate-800">₹{Number(tw.total_revenue).toFixed(2)}</span> ({tw.revenue_share}%)
                          </span>
                          <span>
                            Avg: <span className="font-semibold text-slate-800">₹{Number(tw.avg_order_value).toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Economics Card Grid */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" />
                    Payment Channel Unit Economics
                  </h4>
                  <p className="text-xs text-slate-500">Settlement method share, average ticket, and gross volume</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  Real Gateway Distribution
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paymentEconomics.map((pay, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {formatPaymentName(pay.payment_method)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                        {pay.volume_share}%
                      </span>
                    </div>

                    <div className="text-xl font-extrabold text-slate-900 mb-1">
                      ₹{Number(pay.total_revenue).toFixed(2)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>{pay.order_count} orders</span>
                      <span>Avg Ticket: <strong className="text-slate-700">₹{Number(pay.avg_order_value).toFixed(2)}</strong></span>
                    </div>
                  </div>
                ))}
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
