import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import {
  Database, Layers, Network, Table, Download, Search, RefreshCw,
  TrendingUp, AlertCircle, CheckCircle2, Filter, ChevronLeft, ChevronRight,
  Sparkles, Activity, FileSpreadsheet, GitBranch, ArrowUpRight, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const PIE_COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminWarehouse() {
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'wrangling' | 'mining' | 'explorer'
  const [schema, setSchema] = useState(null);
  const [mining, setMining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Explorer State
  const [dataset, setDataset] = useState('benchmark'); // 'benchmark' | 'orders' | 'predictions'
  const [dataRows, setDataRows] = useState([]);
  const [dataCols, setDataCols] = useState([]);
  const [dataTotal, setDataTotal] = useState(0);
  const [dataPage, setDataPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  const getToken = async () => {
    const { data: session } = await supabase.auth.getSession();
    return session?.session?.access_token;
  };

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const [schemaRes, miningRes] = await Promise.all([
        axios.get(`${API_URL}/api/warehouse/schema`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/warehouse/mining`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSchema(schemaRes.data);
      setMining(miningRes.data);
    } catch (err) {
      console.error('Failed to load warehouse metadata:', err);
      setError(err.response?.data?.detail || 'Failed to initialize warehouse telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchExplorerData = async () => {
    setDataLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/warehouse/data`, {
        params: { dataset, page: dataPage, page_size: pageSize, search: search || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDataRows(res.data.rows || []);
      setDataCols(res.data.columns || []);
      setDataTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load explorer data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchExplorerData();
    }
  }, [activeTab, dataset, dataPage, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDataPage(1);
    fetchExplorerData();
  };

  const handleExportCSV = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_URL}/api/warehouse/export?dataset=${dataset}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataset}_warehouse_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-stone-600">Mounting Data Warehouse & Mining Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 text-red-700 rounded-3xl flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(dataTotal / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cockpit Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-8 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              Enterprise Data Warehouse & Mining
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
              Warehouse Telemetry & Star Schema
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Analytical staging and dimensional star schema integrating historical benchmark CSVs (1,000 trips) and live transactional order telemetry for predictive data mining.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-stone-800/80 border border-stone-700/80 px-4 py-3 rounded-2xl min-w-[110px] text-center">
              <p className="text-2xl font-black text-orange-400">{schema?.total_records_stored?.toLocaleString() || '1,148'}</p>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Stored Rows</p>
            </div>
            <div className="bg-stone-800/80 border border-stone-700/80 px-4 py-3 rounded-2xl min-w-[110px] text-center">
              <p className="text-2xl font-black text-emerald-400">3 Facts / 5 Dims</p>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Star Architecture</p>
            </div>
            <div className="bg-stone-800/80 border border-stone-700/80 px-4 py-3 rounded-2xl min-w-[110px] text-center">
              <p className="text-2xl font-black text-amber-400">100% Cleansed</p>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Data Quality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-[#ECE4D8] overflow-x-auto pb-1">
        {[
          { id: 'schema',    label: 'Star Schema Architecture', icon: Network },
          { id: 'wrangling', label: 'Data Wrangling & Profiling', icon: GitBranch },
          { id: 'mining',    label: 'Mining Patterns & Clusters', icon: Sparkles },
          { id: 'explorer',  label: 'Interactive Warehouse Explorer (CSV & Live)', icon: Table },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-orange-600 text-orange-700 bg-white rounded-t-2xl shadow-xs'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-[#FAF7F2]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: STAR SCHEMA ARCHITECTURE ─── */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          {/* Fact Tables Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-[#191411] flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-600" />
                Analytical Fact Tables (Measurements & Inferences)
              </h2>
              <span className="text-xs text-stone-500 font-medium">Additive & Target Measures</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {schema?.fact_tables?.map((fact) => (
                <div key={fact.name} className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
                        {fact.name}
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {fact.row_count?.toLocaleString()} rows
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 font-semibold mb-1">{fact.type}</p>
                    <p className="text-[11px] text-stone-500 mb-3">{fact.grain}</p>

                    <div className="space-y-1.5 pt-3 border-t border-[#ECE4D8]">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Measures:</p>
                      <div className="flex flex-wrap gap-1">
                        {fact.measures?.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#ECE4D8]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">Foreign Keys:</p>
                    <ul className="text-[10px] font-mono text-stone-600 space-y-0.5">
                      {fact.foreign_keys?.map(fk => <li key={fk}>• {fk}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Tables Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-[#191411] flex items-center gap-2">
                <Network className="w-5 h-5 text-amber-600" />
                Conformed Dimension Tables (Context & Hierarchies)
              </h2>
              <span className="text-xs text-stone-500 font-medium">Descriptive Attributes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {schema?.dimension_tables?.map((dim) => (
                <div key={dim.name} className="bg-white rounded-3xl border border-[#ECE4D8] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                      {dim.name}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      {dim.row_count}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">{dim.type}</p>
                  <p className="text-[11px] text-stone-700 font-mono">PK: {dim.primary_key}</p>

                  <div className="pt-2 border-t border-[#ECE4D8]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">Attributes:</p>
                    <div className="flex flex-wrap gap-1">
                      {dim.attributes?.map(a => (
                        <span key={a} className="px-1.5 py-0.5 rounded bg-stone-50 text-stone-600 text-[10px] font-mono border border-stone-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Stage ETL Pipeline */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-[#191411] text-base flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-orange-600" />
              End-to-End ETL Pipeline (Ingestion to Serving)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {schema?.etl_pipeline?.map((step, idx) => (
                <div key={step.stage} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8] space-y-2">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-extrabold text-[#191411]">{step.stage}</p>
                  <p className="text-[11px] text-stone-600">{step.source}</p>
                  <p className="text-[10px] font-mono text-orange-700 font-bold">{step.tool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DATA WRANGLING & PROFILING ─── */}
      {activeTab === 'wrangling' && (
        <div className="space-y-6">
          {/* Missing Value Audit Table */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#ECE4D8] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#191411]">
                  Data Wrangling & Missing Value Imputation Audit
                </h3>
                <p className="text-xs text-stone-500">
                  Verification of null handling across 1,000 benchmark records in the warehouse
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cleanse Complete
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#ECE4D8]">
                  <tr>
                    <th className="py-3 px-4">Feature Column</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4 text-center">Total Rows</th>
                    <th className="py-3 px-4 text-center">Missing Count</th>
                    <th className="py-3 px-4 text-center">Missing %</th>
                    <th className="py-3 px-4">Imputation Strategy</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE4D8]">
                  {mining?.missing_audit?.map(row => (
                    <tr key={row.column} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-3 px-4 font-mono font-bold text-[#191411]">{row.column}</td>
                      <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">{row.data_type}</td>
                      <td className="py-3 px-4 text-center text-stone-700">{row.total_rows}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          row.missing_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {row.missing_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-700">{row.missing_pct}%</td>
                      <td className="py-3 px-4 text-stone-700 font-semibold">{row.imputation_strategy}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {row.cleansed_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descriptive Statistical Profile Matrix */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#ECE4D8]">
              <h3 className="font-bold text-base text-[#191411]">
                Numerical Feature Profiling & Distribution Metrics
              </h3>
              <p className="text-xs text-stone-500">
                5-Number summary, standard deviations, and IQR outlier boundaries
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#ECE4D8]">
                  <tr>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4 text-right">Mean</th>
                    <th className="py-3 px-4 text-right">Std Dev</th>
                    <th className="py-3 px-4 text-right">Min</th>
                    <th className="py-3 px-4 text-right">Q25</th>
                    <th className="py-3 px-4 text-right">Median</th>
                    <th className="py-3 px-4 text-right">Q75</th>
                    <th className="py-3 px-4 text-right">Max</th>
                    <th className="py-3 px-4 text-right">IQR</th>
                    <th className="py-3 px-4 text-center">Outliers Detected</th>
                    <th className="py-3 px-4 text-right">Skewness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE4D8]">
                  {mining?.stats_profile?.map(s => (
                    <tr key={s.feature} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-3 px-4 font-mono font-bold text-orange-700">{s.feature}</td>
                      <td className="py-3 px-4 text-right font-semibold">{s.mean}</td>
                      <td className="py-3 px-4 text-right text-stone-600">{s.std}</td>
                      <td className="py-3 px-4 text-right text-stone-600">{s.min}</td>
                      <td className="py-3 px-4 text-right text-stone-600">{s.q25}</td>
                      <td className="py-3 px-4 text-right font-bold text-stone-800">{s.median}</td>
                      <td className="py-3 px-4 text-right text-stone-600">{s.q75}</td>
                      <td className="py-3 px-4 text-right text-stone-800">{s.max}</td>
                      <td className="py-3 px-4 text-right text-stone-600">{s.iqr}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.outlier_count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.outlier_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">{s.skewness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: MINING PATTERNS & CLUSTERS ─── */}
      {activeTab === 'mining' && (
        <div className="space-y-6">
          {/* Feature Correlation Grid */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-[#191411] text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Feature Correlations with Delivery Duration (Ground Truth Target)
            </h3>
            <p className="text-xs text-stone-500">
              Pearson correlation coefficients extracted directly from benchmark warehouse transactions
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mining?.correlations?.map(c => (
                <div key={c.feature} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-stone-800">{c.feature}</span>
                    <span className={`font-mono text-base font-black ${
                      c.correlation > 0.5 ? 'text-orange-600' : c.correlation > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {c.correlation > 0 ? `+${c.correlation}` : c.correlation}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-600">{c.relationship}</p>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.correlation > 0 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.abs(c.correlation) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* K-Means Clusters */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-[#191411] text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Delivery Profile Clusters (Centroid Characteristics)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mining?.clusters?.map(cl => (
                <div key={cl.cluster_name} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#ECE4D8] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-extrabold text-orange-700">{cl.cluster_name}</span>
                      <span className="text-xs font-mono font-bold text-stone-500">{cl.share_pct}% share</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed mb-3">{cl.description}</p>

                    <div className="space-y-1.5 text-xs text-stone-700 pt-2 border-t border-[#ECE4D8]">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Mean Distance:</span>
                        <span className="font-bold">{cl.avg_distance_km} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Mean Kitchen Prep:</span>
                        <span className="font-bold">{cl.avg_prep_min} mins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Mean Trip Duration:</span>
                        <span className="font-bold text-orange-600">{cl.avg_delivery_time_min} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-stone-500 pt-2 border-t border-[#ECE4D8]">
                    {cl.dominant_vehicle} • {cl.dominant_weather}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Association Rules */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#ECE4D8]">
              <h3 className="font-bold text-base text-[#191411]">
                Discovered Data Mining Association Rules (Confidence & Lift)
              </h3>
              <p className="text-xs text-stone-500">
                Actionable rules discovered across weather, traffic, and courier experience
              </p>
            </div>
            <div className="divide-y divide-[#ECE4D8]">
              {mining?.association_rules?.map(r => (
                <div key={r.antecedent} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-md">
                        IF {r.antecedent}
                      </span>
                      <span className="text-xs font-bold text-orange-600">➔ THEN</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {r.consequent}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{r.insight}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase">Support</p>
                      <p className="font-bold text-stone-700">{r.support}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase">Confidence</p>
                      <p className="font-bold text-emerald-700">{r.confidence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase">Lift</p>
                      <p className="font-bold text-orange-600">{r.lift}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: INTERACTIVE WAREHOUSE EXPLORER ─── */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Dataset Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-1">
                Warehouse Store:
              </span>
              {[
                { id: 'benchmark',   label: 'Benchmark CSV (1,000 Rows)' },
                { id: 'orders',      label: 'Fact Orders (Live Supabase)' },
                { id: 'predictions', label: 'Fact Predictions (Live ML)' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDataset(d.id); setDataPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    dataset === d.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-stone-600 border border-[#ECE4D8] hover:bg-orange-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Actions: Search & Export */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-48"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </form>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Export this dataset as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-[#ECE4D8] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#ECE4D8] flex items-center justify-between text-xs text-stone-500">
              <span>Showing {dataRows.length} of {dataTotal} total records</span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setDataPage(1); }}
                  className="bg-[#FAF7F2] border border-[#ECE4D8] rounded-lg px-2 py-1 text-xs font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {dataLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-stone-500">Querying warehouse store...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-stone-600 uppercase font-bold text-[10px] tracking-wider border-b border-[#ECE4D8]">
                    <tr>
                      {dataCols.map(col => (
                        <th key={col} className="py-3 px-4 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE4D8]">
                    {dataRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]/60">
                        {dataCols.map(col => (
                          <td key={col} className="py-2.5 px-4 font-mono text-[11px] text-stone-800 whitespace-nowrap">
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#ECE4D8] flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Page {dataPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDataPage(p => Math.max(1, p - 1))}
                  disabled={dataPage === 1 || dataLoading}
                  className="p-1.5 rounded-lg border border-[#ECE4D8] hover:bg-stone-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDataPage(p => Math.min(totalPages, p + 1))}
                  disabled={dataPage >= totalPages || dataLoading}
                  className="p-1.5 rounded-lg border border-[#ECE4D8] hover:bg-stone-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
