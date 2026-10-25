import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Store, MapPin, Clock, User, Ban, RotateCcw, AlertTriangle,
  CheckCircle2, DollarSign, ShoppingBag, XCircle, Search, Filter,
  ShieldAlert, RefreshCw, ChevronRight, ThumbsDown, FileText
} from 'lucide-react';

const PREDEFINED_REASONS = [
  'High order cancellation / rejection rate affecting diner experience',
  'Repeated food safety, hygiene, or quality complaints from diners',
  'Excessive kitchen preparation delays breaching transit SLA',
  'Violation of platform merchant terms and code of conduct',
  'Frequent out-of-stock items accepted then cancelled',
  'Suspicious or fraudulent billing transactions'
];

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'terminated'
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('revenue'); // 'revenue' | 'orders' | 'fulfillment' | 'name'

  // Termination Modal State
  const [terminatingTarget, setTerminatingTarget] = useState(null);
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reinstate Confirmation Modal
  const [reinstatingTarget, setReinstatingTarget] = useState(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/restaurants');
      setRestaurants(res.data.restaurants || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleTerminate = async () => {
    if (!terminatingTarget) return;
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    if (!finalReason) {
      alert('Please specify a reason for partnership termination.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/restaurants/${terminatingTarget.id}/terminate`, {
        reason: finalReason
      });
      setTerminatingTarget(null);
      setCustomReason('');
      fetchRestaurants();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to terminate partnership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async () => {
    if (!reinstatingTarget) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/restaurants/${reinstatingTarget.id}/reinstate`);
      setReinstatingTarget(null);
      fetchRestaurants();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reinstate partnership');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search
  const filtered = restaurants.filter(r => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'active' ? !r.is_terminated :
      r.is_terminated;

    const s = search.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(s) ||
      (r.address && r.address.toLowerCase().includes(s)) ||
      (r.profiles?.full_name && r.profiles.full_name.toLowerCase().includes(s)) ||
      (r.profiles?.email && r.profiles.email.toLowerCase().includes(s));

    return matchesFilter && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const sA = a.stats || {};
    const sB = b.stats || {};
    if (sortKey === 'revenue') return (sB.total_revenue || 0) - (sA.total_revenue || 0);
    if (sortKey === 'orders') return (sB.total_orders || 0) - (sA.total_orders || 0);
    if (sortKey === 'fulfillment') return (sB.fulfillment_rate || 0) - (sA.fulfillment_rate || 0);
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-stone-600">Loading Kitchen Partners & Operations Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
              Kitchen Partner Roster
            </span>
            <span className="text-xs text-stone-400">• Financial & Operational Oversight</span>
          </div>
          <h1 className="font-display text-3xl font-black text-[#191411]">
            Kitchen Partners & Merchant Operations
          </h1>
          <p className="text-xs text-[#6E6157] max-w-2xl">
            Review detailed financials, delivered volume, order rejections, and enforce merchant quality controls or contract termination.
          </p>
        </div>

        <button
          onClick={fetchRestaurants}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-orange-50 text-stone-700 font-bold text-xs rounded-xl border border-[#ECE4D8] transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Platform Executive KPI Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Partners</span>
              <Store className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-black text-[#191411]">{summary.total_restaurants}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Registered kitchens</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Partners</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{summary.active_restaurants}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Taking customer orders</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Terminated</span>
              <Ban className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700">{summary.terminated_restaurants}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Suspended / Deactivated</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Fleet Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">Rs. {summary.total_platform_revenue?.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">{summary.total_platform_orders} total orders</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Fulfillment</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700">{summary.overall_fulfillment_rate}%</p>
            <p className="text-[11px] text-stone-500 mt-0.5">{summary.total_delivered_orders} delivered / {summary.total_rejected_orders} rejected</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#ECE4D8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all',        label: `All (${restaurants.length})` },
            { id: 'active',     label: `Active (${summary?.active_restaurants || 0})` },
            { id: 'terminated', label: `Terminated (${summary?.terminated_restaurants || 0})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-[#ECE4D8] hover:bg-orange-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="Search partner or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ECE4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-52"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="font-bold">Sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-white border border-[#ECE4D8] rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-700 focus:outline-none"
            >
              <option value="revenue">Highest Revenue</option>
              <option value="orders">Most Orders</option>
              <option value="fulfillment">Best Fulfillment %</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kitchen Cards Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#ECE4D8] p-16 text-center shadow-xs">
          <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-600">No restaurants match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((r) => {
            const stats = r.stats || {};
            const isTerminated = r.is_terminated;

            return (
              <div
                key={r.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col justify-between transition-all ${
                  isTerminated
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'border-[#ECE4D8] hover:border-orange-300'
                }`}
              >
                <div>
                  {/* Image & Status Badge */}
                  <div className="h-40 bg-stone-100 relative overflow-hidden">
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className={`w-full h-full object-cover ${isTerminated ? 'grayscale opacity-75' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-100">
                        <Store className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Partnership Badge */}
                    <div className="absolute top-3 right-3">
                      {isTerminated ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5" />
                          Terminated
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active Partner
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="font-display font-black text-lg text-white drop-shadow-sm truncate">
                        {r.name}
                      </h3>
                      <p className="text-[11px] text-white/80 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                        <span>{r.address || 'Location registered'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Termination Banner if Terminated */}
                  {isTerminated && (
                    <div className="p-3.5 bg-rose-100/90 border-b border-rose-200 text-rose-900 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>Partnership Revoked</span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                        Reason: {r.termination_reason || 'Administrative action'}
                      </p>
                      {r.terminated_at && (
                        <p className="text-[10px] text-rose-600">
                          Date: {new Date(r.terminated_at).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Operational Metrics Strip */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Revenue */}
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                        <p className="text-[10px] uppercase font-bold text-stone-400">Total Revenue</p>
                        <p className="text-base font-black text-emerald-700 mt-0.5">
                          Rs. {Number(stats.total_revenue || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-stone-500">From {stats.total_orders || 0} orders</p>
                      </div>

                      {/* Orders Delivered */}
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                        <p className="text-[10px] uppercase font-bold text-stone-400">Delivered Orders</p>
                        <p className="text-base font-black text-blue-700 mt-0.5">
                          {stats.delivered_orders || 0}
                        </p>
                        <p className="text-[10px] text-stone-500">{stats.fulfillment_rate || 0}% success rate</p>
                      </div>

                      {/* Orders Rejected */}
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                        <p className="text-[10px] uppercase font-bold text-stone-400">Rejected Orders</p>
                        <p className={`text-base font-black mt-0.5 ${stats.rejected_orders > 0 ? 'text-rose-600' : 'text-stone-700'}`}>
                          {stats.rejected_orders || 0}
                        </p>
                        <p className="text-[10px] text-stone-500">By kitchen partner</p>
                      </div>

                      {/* Average Ticket */}
                      <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8]">
                        <p className="text-[10px] uppercase font-bold text-stone-400">Average Basket</p>
                        <p className="text-base font-black text-amber-700 mt-0.5">
                          Rs. {Number(stats.avg_order_value || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-stone-500">Prep: ~{r.preparation_time_min} mins</p>
                      </div>
                    </div>

                    {/* Partner Metadata */}
                    <div className="pt-3 border-t border-[#ECE4D8] space-y-1.5 text-xs text-stone-600">
                      {r.clean_description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 italic mb-2">
                          "{r.clean_description}"
                        </p>
                      )}
                      {r.profiles && (
                        <p className="flex items-center gap-1.5 text-stone-700 font-medium">
                          <User className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>Owner: {r.profiles.full_name || 'Merchant Partner'} ({r.profiles.email})</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Terminate / Reinstate */}
                <div className="p-4 bg-[#FAF7F2] border-t border-[#ECE4D8] flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono text-stone-400">
                    ID: {r.id.slice(0, 8)}
                  </span>

                  {isTerminated ? (
                    <button
                      onClick={() => setReinstatingTarget(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reinstate Partnership</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTerminatingTarget(r);
                        setSelectedReason(PREDEFINED_REASONS[0]);
                        setCustomReason('');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Terminate Partnership</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TERMINATION MODAL ─── */}
      {terminatingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-red-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-xl text-[#191411]">
                  Terminate Partner Agreement
                </h3>
                <p className="text-xs text-stone-500">
                  You are revoking platform partnership for <span className="font-bold text-stone-800">{terminatingTarget.name}</span>. This will immediately disable customer ordering from this restaurant.
                </p>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Select Cause for Termination:
              </label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {PREDEFINED_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      selectedReason === reason
                        ? 'border-orange-500 bg-orange-50/60 text-orange-950 font-bold'
                        : 'border-[#ECE4D8] hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="termination_reason"
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">
                Additional Audit Notes / Custom Remarks:
              </label>
              <textarea
                rows={2}
                placeholder="Optional specific incident or documentation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#ECE4D8] focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE4D8]">
              <button
                onClick={() => setTerminatingTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-[#ECE4D8] text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Terminating...' : 'Confirm Termination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REINSTATE MODAL ─── */}
      {reinstatingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-[#191411]">
                  Reinstate Kitchen Partner
                </h3>
                <p className="text-xs text-stone-500">
                  Restore active merchant partnership for <span className="font-bold text-stone-800">{reinstatingTarget.name}</span>. This kitchen will resume receiving diner orders.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE4D8]">
              <button
                onClick={() => setReinstatingTarget(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-[#ECE4D8] text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReinstate}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Reinstating...' : 'Reinstate Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
