import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/predictions/history');
        setPredictions(response.data.predictions);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Prediction History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Distance</th>
              <th className="px-6 py-4 font-medium">Weather / Traffic</th>
              <th className="px-6 py-4 font-medium">Vehicle</th>
              <th className="px-6 py-4 font-medium text-right">Predicted Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {predictions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No predictions found. Go to the Predict page to make one!
                </td>
              </tr>
            ) : (
              predictions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(p.created_at).toLocaleDateString()}<br/>
                    <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{p.distance_km} km</td>
                  <td className="px-6 py-4">
                    <span className="block text-slate-700">{p.weather}</span>
                    <span className="text-xs text-slate-500">{p.traffic_level} Traffic</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{p.vehicle_type}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
