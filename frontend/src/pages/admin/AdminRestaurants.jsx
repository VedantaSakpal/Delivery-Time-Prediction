import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Store, MapPin, Clock, User, Ban, RotateCcw, AlertTriangle,
  CheckCircle2, DollarSign, ShoppingBag, XCircle, Search, Filter,
  ShieldAlert, RefreshCw, ChevronRight, ThumbsDown, FileText,
  ShieldCheck, Check, Sparkles, AlertCircle, Phone, Mail, Award
} from 'lucide-react';

const PREDEFINED_REASONS = [
  'High order cancellation / rejection rate affecting diner experience',
  'Repeated food safety, hygiene, or quality complaints from diners',
  'Excessive kitchen preparation delays breaching transit SLA',
  'Violation of platform merchant terms and code of conduct',
  'Frequent out-of-stock items accepted then cancelled',
  'Suspicious or fraudulent billing transactions'
];

const APPLICATION_REJECTION_REASONS = [
  'FSSAI Food License number is invalid, expired, or unverifiable on FoSCoS portal',
  'Kitchen physical address is outside current delivery radius and platform coverage',
  'Commercial kitchen hygiene or infrastructure documentation missing',
  'Duplicate or incomplete merchant application details submitted',
  'Unable to verify proprietor identity or contact phone number'
];

export default function AdminRestaurants() {
  // Main view tab: 'active_partners' | 'applications'
  const [activeMainTab, setActiveMainTab] = useState('active_partners');

  // Active Partners State
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

  // Applications State
  const [applications, setApplications] = useState([]);
  const [applicationsCounts, setApplicationsCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [appFilter, setAppFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [appSearch, setAppSearch] = useState('');
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState(APPLICATION_REJECTION_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [appActionLoading, setAppActionLoading] = useState(false);
  const [appActionSuccess, setAppActionSuccess] = useState(null);

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

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const res = await api.get('/admin/applications');
      setApplications(res.data.applications || []);
      setApplicationsCounts(res.data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchApplications();
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

  // Application Approval Handler
  const handleApproveApplication = async (appId) => {
    if (!window.confirm("Approve this kitchen partner? They will be immediately onboarded with an active restaurant profile and starter menu items.")) {
      return;
    }
    setAppActionLoading(true);
    try {
      const res = await api.post(`/admin/applications/${appId}/approve`);
      setAppActionSuccess(res.data?.message || 'Kitchen partner approved successfully!');
      await fetchApplications();
      await fetchRestaurants();
      setTimeout(() => setAppActionSuccess(null), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve application');
    } finally {
      setAppActionLoading(false);
    }
  };

  // Application Rejection Handler
  const handleRejectApplication = async () => {
    if (!rejectingApp) return;
    const finalReason = customRejectReason.trim() ? customRejectReason.trim() : rejectReasonPreset;
    if (!finalReason) {
      alert('Please specify a rejection reason.');
      return;
    }
    setAppActionLoading(true);
    try {
      const res = await api.post(`/admin/applications/${rejectingApp.id}/reject`, {
        reason: finalReason
      });
      setRejectingApp(null);
      setCustomRejectReason('');
      setAppActionSuccess(res.data?.message || 'Application rejected.');
      await fetchApplications();
      setTimeout(() => setAppActionSuccess(null), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject application');
    } finally {
      setAppActionLoading(false);
    }
  };

  // Filter & Search Active Restaurants
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

  // Sort Active Restaurants
  const sorted = [...filtered].sort((a, b) => {
    const sA = a.stats || {};
    const sB = b.stats || {};
    if (sortKey === 'revenue') return (sB.total_revenue || 0) - (sA.total_revenue || 0);
    if (sortKey === 'orders') return (sB.total_orders || 0) - (sA.total_orders || 0);
    if (sortKey === 'fulfillment') return (sB.fulfillment_rate || 0) - (sA.fulfillment_rate || 0);
    return a.name.localeCompare(b.name);
  });

  // Filter & Search Applications
  const filteredApplications = applications.filter(app => {
    const matchesFilter =
      appFilter === 'all' ? true :
      appFilter === 'pending' ? app.status === 'pending_approval' :
      appFilter === 'approved' ? app.status === 'approved' :
      app.status === 'rejected';

    const s = appSearch.toLowerCase();
    const matchesSearch =
      (app.restaurant_name && app.restaurant_name.toLowerCase().includes(s)) ||
      (app.owner_name && app.owner_name.toLowerCase().includes(s)) ||
      (app.email && app.email.toLowerCase().includes(s)) ||
      (app.phone && app.phone.toLowerCase().includes(s)) ||
      (app.fssai_license && app.fssai_license.toLowerCase().includes(s)) ||
      (app.cuisine_type && app.cuisine_type.toLowerCase().includes(s)) ||
      (app.address && app.address.toLowerCase().includes(s));

    return matchesFilter && matchesSearch;
  });

  if (loading && !summary) {
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
              Kitchen Partner Command Center
            </span>
            <span className="text-xs text-stone-400">• Financial & Operational Oversight</span>
          </div>
          <h1 className="font-display text-3xl font-black text-[#191411]">
            Kitchen Partners & Merchant Operations
          </h1>
          <p className="text-xs text-[#6E6157] max-w-2xl">
            Review detailed financials, delivered volume, order rejections, and review incoming partner applications to approve or reject new kitchens.
          </p>
        </div>

        <button
          onClick={() => { fetchRestaurants(); fetchApplications(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-orange-50 text-stone-700 font-bold text-xs rounded-xl border border-[#ECE4D8] transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex border-b border-[#ECE4D8] gap-4 sm:gap-8 px-2">
        <button
          onClick={() => setActiveMainTab('active_partners')}
          className={`pb-3 font-display font-black text-sm sm:text-base border-b-2 flex items-center gap-2.5 cursor-pointer transition-all ${
            activeMainTab === 'active_partners'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Active Kitchen Partners</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
            {restaurants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('applications')}
          className={`pb-3 font-display font-black text-sm sm:text-base border-b-2 flex items-center gap-2.5 cursor-pointer transition-all ${
            activeMainTab === 'applications'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Partner Applications</span>
          {applicationsCounts.pending > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {applicationsCounts.pending} Pending Review
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* Success Notification Banner */}
      {appActionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{appActionSuccess}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 1: ACTIVE KITCHEN PARTNERS                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeMainTab === 'active_partners' && (
        <div className="space-y-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {sorted.map(r => {
                const s = r.stats || {};
                const isTerm = r.is_terminated;

                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isTerm
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-[#ECE4D8] hover:border-orange-300'
                    }`}
                  >
                    <div>
                      {/* Top Header Card Info */}
                      <div className="p-6 border-b border-[#ECE4D8]/70 flex items-start gap-4">
                        <img
                          src={r.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'}
                          alt={r.name}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#ECE4D8]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display font-black text-lg text-[#191411] truncate">
                              {r.name}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                isTerm
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isTerm ? 'Terminated' : 'Active Partner'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{r.address || 'Address on file'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{r.preparation_time_min || 20} min prep</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1.5">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            <span className="font-medium text-stone-700">
                              {r.profiles?.full_name || 'Merchant Owner'}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500 text-[11px]">{r.profiles?.email || 'No email'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Operations & Revenue Telemetry */}
                      <div className="p-5 bg-[#FAF7F2]/60 grid grid-cols-4 gap-2 text-center border-b border-[#ECE4D8]/70">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">Revenue</span>
                          <span className="text-sm font-black text-emerald-700">
                            Rs. {(s.total_revenue || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">Delivered</span>
                          <span className="text-sm font-black text-blue-700">
                            {s.delivered_orders || 0}
                          </span>
                          <span className="text-[9px] text-stone-400 block">/ {s.total_orders || 0} orders</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">Rejected</span>
                          <span className={`text-sm font-black ${(s.rejected_orders || 0) > 0 ? 'text-rose-600' : 'text-stone-500'}`}>
                            {s.rejected_orders || 0}
                          </span>
                          <span className="text-[9px] text-stone-400 block">{s.rejection_rate || 0}% rate</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">Fulfillment</span>
                          <span className="text-sm font-black text-stone-800">
                            {s.fulfillment_rate || 0}%
                          </span>
                          <span className="text-[9px] text-stone-400 block">AOV: Rs. {s.avg_order_value || 0}</span>
                        </div>
                      </div>

                      {/* Termination Warning Banner if terminated */}
                      {isTerm && (
                        <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-rose-950 block">Partnership Suspended</span>
                            <p className="text-[11px] text-rose-800">
                              <strong>Reason:</strong> {r.termination_reason || 'Compliance violation'}
                            </p>
                            {r.terminated_at && (
                              <p className="text-[10px] text-rose-600">
                                Suspended on {new Date(r.terminated_at).toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Clean Description */}
                      {r.clean_description && (
                        <div className="p-4 text-xs text-[#6E6157] italic line-clamp-2">
                          "{r.clean_description}"
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-4 bg-white border-t border-[#ECE4D8] flex items-center justify-between gap-3">
                      <div className="text-[11px] text-stone-400">
                        Merchant ID: <code className="font-mono text-[10px]">{r.id.substring(0, 8)}...</code>
                      </div>

                      {isTerm ? (
                        <button
                          onClick={() => setReinstatingTarget(r)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reinstate Partner</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setTerminatingTarget(r);
                            setSelectedReason(PREDEFINED_REASONS[0]);
                            setCustomReason('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 2: PARTNER APPLICATIONS (PENDING / REVIEW)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeMainTab === 'applications' && (
        <div className="space-y-6">
          
          {/* Applications Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ECE4D8] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Total Submissions</span>
              <p className="text-2xl font-black text-[#191411]">{applicationsCounts.total}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">All received applications</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">Pending Review</span>
              <p className="text-2xl font-black text-amber-800">{applicationsCounts.pending}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Awaiting admin verdict</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Approved & Onboarded</span>
              <p className="text-2xl font-black text-emerald-800">{applicationsCounts.approved}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Active on ZaikaPulse</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">Rejected Submissions</span>
              <p className="text-2xl font-black text-rose-800">{applicationsCounts.rejected}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">Non-compliant / invalid FSSAI</p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#ECE4D8] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {[
                { id: 'all',      label: `All (${applicationsCounts.total})` },
                { id: 'pending',  label: `Pending Review (${applicationsCounts.pending})` },
                { id: 'approved', label: `Approved (${applicationsCounts.approved})` },
                { id: 'rejected', label: `Rejected (${applicationsCounts.rejected})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAppFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    appFilter === f.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-[#ECE4D8] hover:bg-orange-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search applicant, FSSAI, or cuisine..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#ECE4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Applications Cards List */}
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#ECE4D8] p-16 text-center shadow-xs">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-stone-600">No partner applications match the selected criteria.</p>
              <p className="text-xs text-stone-400 mt-1">New applicant submissions from the registration page will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(app => {
                const isPending = app.status === 'pending_approval';
                const isApproved = app.status === 'approved';
                const isRejected = app.status === 'rejected';

                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-3xl border p-6 shadow-xs transition-all space-y-4 ${
                      isPending
                        ? 'border-amber-300 bg-amber-50/10 hover:border-amber-400'
                        : isApproved
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-rose-200 bg-rose-50/10'
                    }`}
                  >
                    {/* Header Row: Thumbnail + Kitchen Name + Badges + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={app.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                          alt={app.restaurant_name}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#ECE4D8]"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-black text-xl text-[#191411]">
                              {app.restaurant_name}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                              {app.cuisine_type || 'Indian Cuisine'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                              {app.preparation_time_min || 20}m prep SLA
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-600 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <strong className="text-stone-900">{app.owner_name}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-stone-400" />
                              <span>{app.email}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              <span>{app.phone}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isPending && (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved Partner</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Application Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Application Details Body Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#ECE4D8] text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 block uppercase">FSSAI Food License</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="font-mono font-bold text-stone-800">{app.fssai_license || 'Not provided'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold text-stone-400 block uppercase">Kitchen Address</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-stone-700">{app.address || 'Address not specified'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3 pt-2 border-t border-[#ECE4D8]/80">
                        <span className="text-[10px] font-bold text-stone-400 block uppercase mb-0.5">Culinary Description</span>
                        <p className="text-stone-700 italic">"{app.description || 'No description provided.'}"</p>
                      </div>
                    </div>

                    {/* Rejection / Approval Audit Note */}
                    {isRejected && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-950">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Administrative Rejection Reason:</span>
                        </div>
                        <p className="text-rose-800 italic pl-5">"{app.rejection_reason}"</p>
                        <p className="text-[10px] text-stone-500 pl-5">
                          Reviewed by {app.reviewed_by} on {new Date(app.reviewed_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}

                    {isApproved && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
                        <span>Onboarded by {app.reviewed_by} on {new Date(app.reviewed_at).toLocaleDateString('en-IN')}</span>
                        {app.restaurant_id && (
                          <span className="font-mono text-[11px] text-emerald-700 font-bold">Restaurant ID: {app.restaurant_id.substring(0, 8)}...</span>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Footer for Pending Applications */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#ECE4D8]">
                      <div className="text-[11px] text-stone-400">
                        Application Ref: <code className="font-mono">{app.id}</code> • Submitted on {new Date(app.applied_at).toLocaleString('en-IN')}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setRejectingApp(app);
                              setRejectReasonPreset(APPLICATION_REJECTION_REASONS[0]);
                              setCustomRejectReason('');
                            }}
                            disabled={appActionLoading}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApproveApplication(app.id)}
                            disabled={appActionLoading}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Partner</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ─── APPLICATION REJECTION MODAL ─── */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-[#191411]">
                  Reject Partner Application
                </h3>
                <p className="text-xs text-stone-500">
                  Provide an administrative reason for rejecting <span className="font-bold text-stone-800">{rejectingApp.restaurant_name}</span>. The applicant will be notified upon logging in.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#191411]">Standard Rejection Justification</label>
              <div className="space-y-2">
                {APPLICATION_REJECTION_REASONS.map((r, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      rejectReasonPreset === r && !customRejectReason
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold'
                        : 'border-[#ECE4D8] text-stone-600 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="app_reject_reason"
                      checked={rejectReasonPreset === r && !customRejectReason}
                      onChange={() => {
                        setRejectReasonPreset(r);
                        setCustomRejectReason('');
                      }}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#191411]">Or Custom Rejection Reason</label>
                <textarea
                  rows={2}
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Specify custom compliance issues or instructions..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE4D8]">
              <button
                onClick={() => setRejectingApp(null)}
                disabled={appActionLoading}
                className="px-4 py-2 rounded-xl border border-[#ECE4D8] text-xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectApplication}
                disabled={appActionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {appActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TERMINATION MODAL (ACTIVE PARTNERS) ─── */}
      {terminatingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-lg text-[#191411]">
                  Terminate Merchant Partnership
                </h3>
                <p className="text-xs text-stone-500">
                  Suspension for <span className="font-bold text-stone-800">{terminatingTarget.name}</span>. Diners will immediately cease to see this restaurant in active listings.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#191411]">Select Termination Reason</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {PREDEFINED_REASONS.map((r, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === r && !customReason
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold'
                        : 'border-[#ECE4D8] text-stone-600 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="term_reason"
                      checked={selectedReason === r && !customReason}
                      onChange={() => {
                        setSelectedReason(r);
                        setCustomReason('');
                      }}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-[#191411]">Or Custom Administrative Clause</label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type specific merchant audit findings..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

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

      {/* ─── REINSTATE MODAL (ACTIVE PARTNERS) ─── */}
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
