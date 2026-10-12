import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, Users, FileText, Clock, AlertTriangle, TrendingDown, TrendingUp, Store, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ModelComparisonTable from '../../components/ModelComparisonTable';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Platform Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.total_users || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Restaurants</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.total_restaurants || 0}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Store size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.total_orders || 0}</h3>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Predictions</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.total_predictions || 0}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Delivery Time</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.average_predicted_delivery_time || 0} <span className="text-sm text-slate-400">min</span></h3>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Delayed Predictions</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.delayed_predictions || 0}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">Minimum Time</h4>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats?.minimum_predicted_time} min</p>
          </div>
          <TrendingDown size={48} className="text-green-200" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-800">Maximum Time</h4>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats?.maximum_predicted_time} min</p>
          </div>
          <TrendingUp size={48} className="text-red-200" />
        </div>
      </div>

      <ModelComparisonTable />
    </div>
  );
}
