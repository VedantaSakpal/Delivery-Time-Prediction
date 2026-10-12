import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await api.get('/admin/predictions');
        setPredictions(response.data.predictions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">All Predictions Log</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">User ID</th>
              <th className="px-6 py-4 font-medium">Features</th>
              <th className="px-6 py-4 font-medium text-right">Predicted Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {predictions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-600">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[150px]">
                  {p.user_id}
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Dist: {p.distance_km}km</span>
                    <span>Prep: {p.preparation_time_min}m</span>
                    <span>Weather: {p.weather}</span>
                    <span>Traffic: {p.traffic_level}</span>
                    <span>Vehicle: {p.vehicle_type}</span>
                    <span>Time: {p.time_of_day}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-lg font-bold text-slate-800">{p.predicted_delivery_time_min}</span>
                  <span className="text-slate-500 text-xs ml-1">min</span>
                  <br />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.prediction_category === 'Fast' ? 'bg-green-100 text-green-700' :
                    p.prediction_category === 'Delayed' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {p.prediction_category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
