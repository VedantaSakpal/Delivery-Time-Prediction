import { useState } from 'react';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function Predict() {
  const [formData, setFormData] = useState({
    distance_km: 5.0,
    weather: 'Clear',
    traffic_level: 'Low',
    time_of_day: 'Afternoon',
    vehicle_type: 'Scooter',
    preparation_time_min: 15,
    courier_experience_yrs: 2.0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ['distance_km', 'preparation_time_min', 'courier_experience_yrs'].includes(name);
    setFormData(prev => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.post('/predictions/predict', formData);
      setResult(response.data.prediction);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Food Delivery Time Predictor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Distance (km)</label>
            <input type="number" step="0.1" name="distance_km" value={formData.distance_km} onChange={handleChange} required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preparation Time (min)</label>
            <input type="number" name="preparation_time_min" value={formData.preparation_time_min} onChange={handleChange} required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Courier Experience (years)</label>
            <input type="number" step="0.1" name="courier_experience_yrs" value={formData.courier_experience_yrs} onChange={handleChange} required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Weather</label>
            <select name="weather" value={formData.weather} onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="Clear">Clear</option>
              <option value="Foggy">Foggy</option>
              <option value="Windy">Windy</option>
              <option value="Rainy">Rainy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Traffic Level</label>
            <select name="traffic_level" value={formData.traffic_level} onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time of Day</label>
            <select name="time_of_day" value={formData.time_of_day} onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
            <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="Scooter">Scooter</option>
              <option value="Bike">Bike</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Car">Car</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center">
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          Predict Delivery Time
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          {/* SECTION 1: PREDICTION */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center shadow-sm">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Estimated Delivery Time</h3>
            <div className="text-5xl font-extrabold text-blue-600 mb-2">
              {result.predicted_delivery_time_min} <span className="text-2xl text-blue-500 font-medium">min</span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${result.prediction_category === 'Fast' ? 'bg-green-100 text-green-800' : 
                result.prediction_category === 'Delayed' ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'}`}>
              {result.prediction_category}
            </span>
          </div>

          {/* SECTION 2: RELIABILITY */}
          {(result.prediction_range || result.reliability) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Delivery Range</h4>
                <div className="text-xl font-bold text-slate-700">
                  {result.prediction_range?.lower} – {result.prediction_range?.upper} min
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm text-center flex flex-col justify-center items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reliability</h4>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${
                  result.reliability === 'High' ? 'bg-green-50 text-green-700 border-green-200' :
                  result.reliability === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {result.reliability}
                </span>
              </div>
            </div>
          )}

          {/* SECTION 3: EXPLANATION */}
          {result.explanation && result.explanation.length > 0 && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Why This Prediction?</h3>
              <div className="space-y-4">
                {result.explanation.map((item, index) => {
                  // Normalize width for UI display (max 15 min impact for 100% width)
                  const widthPercent = Math.min(100, (Math.abs(item.impact) / 15) * 100);
                  const isPositive = item.impact > 0;
                  return (
                    <div key={index} className="flex flex-col">
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-slate-700 capitalize">{item.feature}</span>
                        <span className={isPositive ? 'text-red-600' : 'text-green-600'}>
                          {isPositive ? '+' : ''}{item.impact} min
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                        {/* If negative, show green bar going left (aligned right in half) or just simple color */}
                        <div 
                          className={`h-2.5 rounded-full ${isPositive ? 'bg-red-400' : 'bg-green-400'}`} 
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
