import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Download, Calendar, TrendingUp, DollarSign, ShoppingBag,
  CheckCircle2, Clock, Filter, AlertCircle, RefreshCw, ChevronRight, Store, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { supabase } from '../utils/supabase';
import { generateOperationsReportPDF } from '../utils/generateReportPDF';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const STATUS_BADGE = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted:         'bg-blue-100 text-blue-800 border-blue-200',
  preparing:        'bg-orange-100 text-orange-800 border-orange-200',
  ready:            'bg-teal-100 text-teal-800 border-teal-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected:         'bg-rose-100 text-rose-800 border-rose-200',
};

export default function OperationsReportView({ userRole = 'restaurant', restaurantsList = [] }) {
  const [granularity, setGranularity] = useState('day'); // 'day' | 'week' | 'month' | 'year'
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      let url = `${API_URL}/api/reports/operations?granularity=${granularity}`;
      if (userRole === 'admin' && selectedRestaurant !== 'all') {
        url += `&restaurant_id=${selectedRestaurant}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err.response?.data?.detail || 'Failed to generate operations report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [granularity, selectedRestaurant]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      generateOperationsReportPDF(report, {
        userRole,
        generatedBy: userRole === 'admin' ? 'Platform Administrator' : 'Kitchen Manager'
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const summary = report?.summary || {};
  const periodicData = report?.periodic_data || [];
  const statusBreakdown = report?.status_breakdown || [];
  const topPerformers = report?.top_performers || [];
  const recentOperations = report?.recent_operations || [];

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700">
              Audit & Analytics
            </span>
            <span className="text-xs text-stone-400">• Day, Week, Month & Year Rollups</span>
          </div>
          <h2 className="text-2xl font-black text-[#191411]">
            {userRole === 'admin' ? 'Enterprise Operations & Financial Audit' : 'Kitchen Operations & Sales Report'}
          </h2>
          <p className="text-xs text-[#6E6157] mt-0.5">
            Export executive PDF reports formatted for operational leadership, department heads, and audits.
          </p>
        </div>

        {/* Right side download action */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#ECE4D8] text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading || downloading || !report}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Compiling PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Granularity & Restaurant Scope */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#ECE4D8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Granularity Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            Time Rollup:
          </span>
          {[
            { id: 'day',   label: 'Day-wise (Daily)' },
            { id: 'week',  label: 'Week-wise' },
            { id: 'month', label: 'Month-wise' },
            { id: 'year',  label: 'Year-wise (Annual)' },
          ].map(g => (
            <button
              key={g.id}
              onClick={() => setGranularity(g.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                granularity === g.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-[#ECE4D8] hover:bg-orange-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Restaurant selector for Admin */}
        {userRole === 'admin' && restaurantsList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              Kitchen Scope:
            </span>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="bg-white border border-[#ECE4D8] text-xs font-bold text-[#191411] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Kitchen Partners (Platform-wide)</option>
              {restaurantsList.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-[#ECE4D8]">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-600">Compiling {granularity}-wise operational metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Volume</span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#191411]">{summary.total_orders || 0}</p>
              <p className="text-[11px] text-stone-500 mt-1">Logged operational orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Gross Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700">₹{Number(summary.total_revenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-stone-500 mt-1">Calculated from order totals</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Fulfillment Rate</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#191411]">{summary.fulfillment_rate || 0}%</p>
              <p className="text-[11px] text-stone-500 mt-1">{summary.delivered_orders || 0} successfully delivered</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Average Basket (AOV)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#191411]">₹{Number(summary.avg_order_value || 0).toFixed(2)}</p>
              <p className="text-[11px] text-stone-500 mt-1">Avg ~{summary.avg_delivery_time_min || 28} mins ETA</p>
            </div>
          </div>

          {/* Revenue & Volume Chart */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-[#191411] text-base">
                  📈 {granularity.toUpperCase()} Financial & Volume Velocity
                </h3>
                <p className="text-xs text-stone-500">Chronological transaction progression across selected granularity</p>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                {periodicData.length} Period Entries Logged
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...periodicData].reverse()}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ebe1" />
                  <XAxis dataKey="period_label" tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#ea580c' }} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : val,
                      name === 'revenue' ? 'Gross Revenue' : 'Orders Count'
                    ]}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Bar yAxisId="right" dataKey="total_orders" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Granular Breakdown Table */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#ECE4D8] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#191411]">
                  📋 {granularity.toUpperCase()} Operations Summary Table
                </h3>
                <p className="text-xs text-stone-500">Day-to-day metrics ready for executive review</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
              >
                <span>Export PDF</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#ECE4D8]">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Revenue (₹)</th>
                    <th className="py-3 px-4 text-center">Delivered</th>
                    <th className="py-3 px-4 text-center">Active/Pending</th>
                    <th className="py-3 px-4 text-center">Fulfillment %</th>
                    <th className="py-3 px-4 text-right">Avg Ticket (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE4D8]">
                  {periodicData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-stone-400">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    periodicData.map((row) => (
                      <tr key={row.period_key} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#191411]">
                          {row.period_label || row.period_key}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-stone-700">
                          {row.total_orders}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          ₹{Number(row.revenue).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-600">
                          {row.delivered_orders}
                        </td>
                        <td className="py-3 px-4 text-center text-amber-700 font-semibold">
                          {row.active_orders}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            row.fulfillment_rate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {row.fulfillment_rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-600">
                          ₹{Number(row.avg_order_value).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {periodicData.length > 0 && (
                  <tfoot className="bg-[#FAF7F2] font-bold border-t-2 border-[#ECE4D8] text-stone-800">
                    <tr>
                      <td className="py-3.5 px-4 text-orange-700">TOTAL / AVERAGE</td>
                      <td className="py-3.5 px-4 text-center">{summary.total_orders}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700">₹{Number(summary.total_revenue).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-center">{summary.delivered_orders}</td>
                      <td className="py-3.5 px-4 text-center">{summary.active_orders}</td>
                      <td className="py-3.5 px-4 text-center">{summary.fulfillment_rate}%</td>
                      <td className="py-3.5 px-4 text-right">₹{Number(summary.avg_order_value).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Two-column sub-metrics: Status Breakdown & Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-[#191411] text-sm uppercase tracking-wider text-stone-500">
                📦 Order Status Breakdown
              </h3>
              <div className="space-y-2.5">
                {statusBreakdown.map(s => {
                  const badgeClass = STATUS_BADGE[s.status] || 'bg-stone-100 text-stone-700 border-stone-200';
                  return (
                    <div key={s.status} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${badgeClass}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">{s.count} order(s)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#191411]">₹{Number(s.revenue).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-stone-400">{s.share_pct}% of total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-[#191411] text-sm uppercase tracking-wider text-stone-500">
                {userRole === 'restaurant' ? '🏆 Top Selling Dishes' : '🏆 Top Kitchen Partners'}
              </h3>
              <div className="space-y-2.5">
                {topPerformers.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No sales logged yet</p>
                ) : (
                  topPerformers.map((p, idx) => (
                    <div key={p.name} className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#191411]">{p.name}</p>
                          <p className="text-[11px] text-stone-500">
                            {userRole === 'restaurant' ? `${p.quantity_sold} sold` : `${p.orders_count} orders handled`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-700">₹{Number(p.total_revenue).toLocaleString('en-IN')}</p>
                        {p.fulfillment_rate !== undefined && (
                          <p className="text-[10px] text-stone-400">{p.fulfillment_rate}% fulfilled</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Operations Log */}
          {recentOperations.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#ECE4D8]">
                <h3 className="font-bold text-base text-[#191411]">
                  ⏱️ Recent Transaction Logs
                </h3>
                <p className="text-xs text-stone-500">Live operational events included in this reporting period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#ECE4D8]">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE4D8]">
                    {recentOperations.slice(0, 10).map(o => (
                      <tr key={o.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-orange-600">
                          #{o.short_id}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {o.formatted_time}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-800">
                          {o.customer_name}
                        </td>
                        <td className="py-3 px-4 text-stone-600 max-w-[220px] truncate">
                          {o.items_summary}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          ₹{o.total_amount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${STATUS_BADGE[o.status] || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
