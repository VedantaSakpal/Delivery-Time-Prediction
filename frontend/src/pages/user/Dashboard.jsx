import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/predictions/history');
        const preds = response.data.predictions;
        
        if (preds.length > 0) {
          const total = preds.length;
          const avg = preds.reduce((acc, p) => acc + p.predicted_delivery_time_min, 0) / total;
          const fastest = Math.min(...preds.map(p => p.predicted_delivery_time_min));
          const latest = preds[0].predicted_delivery_time_min;
          
          setStats({
            total,
            avg: avg.toFixed(1),
            fastest,
            latest
          });
        } else {
          setStats({ total: 0, avg: 0, fastest: 0, latest: 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Your Overview</h2>
        <Link to="/user/predict" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          New Prediction
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Predictions</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.total || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Average Time</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.avg || 0} <span className="text-lg text-slate-400">min</span></h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Fastest Prediction</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.fastest || 0} <span className="text-lg text-slate-400">min</span></h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Latest Prediction</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.latest || 0} <span className="text-lg text-slate-400">min</span></h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
