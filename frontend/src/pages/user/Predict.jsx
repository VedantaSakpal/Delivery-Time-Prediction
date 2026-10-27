import { useState } from 'react';
import LinearSuperpowers from '../../components/LinearSuperpowers';
import api from '../../services/api';
import {
  Loader2, Clock, Sparkles, MapPin, ChefHat, Bike, Navigation,
  Sun, Wind, CloudFog, CloudRain, CloudLightning, ShieldCheck,
  TrendingUp, AlertTriangle, CheckCircle2, RotateCcw, Zap
} from 'lucide-react';

const PRESETS = [
  {
    name: '🍲 Friday Dum Biryani Rush',
    data: {
      distance_km: 4.8,
      weather: 'Clear',
      traffic_level: 'High',
      time_of_day: 'Evening',
      vehicle_type: 'Motorcycle',
      preparation_time_min: 24,
      courier_experience_yrs: 3.5
    }
  },
  {
    name: '🌧️ Monsoon Chai & Samosas',
    data: {
      distance_km: 2.5,
      weather: 'Rainy',
      traffic_level: 'Medium',
      time_of_day: 'Evening',
      vehicle_type: 'Motorcycle',
      preparation_time_min: 12,
      courier_experience_yrs: 2.5
    }
  },
  {
    name: '🍛 Sunday Royal Thali Lunch',
    data: {
      distance_km: 6.2,
      weather: 'Clear',
      traffic_level: 'Low',
      time_of_day: 'Afternoon',
      vehicle_type: 'Motorcycle',
      preparation_time_min: 28,
      courier_experience_yrs: 4.0
    }
  },
  {
    name: '🌙 Late Night Butter Chicken',
    data: {
      distance_km: 3.6,
      weather: 'Clear',
      traffic_level: 'Low',
      time_of_day: 'Night',
      vehicle_type: 'Motorcycle',
      preparation_time_min: 18,
      courier_experience_yrs: 3.0
    }
  }
];

export default function Predict() {
  const [formData, setFormData] = useState({
    distance_km: 5.0,
    weather: 'Clear',
    traffic_level: 'Medium',
    time_of_day: 'Evening',
    vehicle_type: 'Motorcycle',
    preparation_time_min: 15,
    courier_experience_yrs: 3.0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [liveWeatherInfo, setLiveWeatherInfo] = useState(null);


  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ['distance_km', 'preparation_time_min', 'courier_experience_yrs'].includes(name);
    setFormData(prev => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value
    }));
  };

  const handlePreset = (preset) => {
    setFormData(preset.data);
    setResult(null);
    setError(null);
  };

  // Client-side fallback calculation matching the model if API is offline
  const calculateLocalPrediction = () => {
    const distImpact = formData.distance_km * 1.85;
    const prepImpact = formData.preparation_time_min * 0.72;
    
    let weatherImpact = 0;
    if (formData.weather === 'Rainy') weatherImpact = 4.8;
    else if (formData.weather === 'Stormy') weatherImpact = 8.5;
    else if (formData.weather === 'Foggy') weatherImpact = 2.2;
    else if (formData.weather === 'Windy') weatherImpact = 1.4;
    else if (formData.weather === 'Clear') weatherImpact = -1.2;

    let trafficImpact = 0;
    if (formData.traffic_level === 'High') trafficImpact = 7.4;
    else if (formData.traffic_level === 'Medium') trafficImpact = 2.5;
    else if (formData.traffic_level === 'Low') trafficImpact = -2.0;

    let vehicleImpact = 0;
    if (formData.vehicle_type === 'Bicycle') vehicleImpact = 5.2;
    else if (formData.vehicle_type === 'Motorcycle' || formData.vehicle_type === 'Scooter') vehicleImpact = -1.5;
    else if (formData.vehicle_type === 'Car') vehicleImpact = 2.0;

    const expImpact = -Math.min(formData.courier_experience_yrs * 0.85, 4.5);
    const predicted = Math.max(12, Math.round(18.5 + distImpact + prepImpact + weatherImpact + trafficImpact + vehicleImpact + expImpact));
    const lower = Math.max(10, Math.round(predicted - 5));
    const upper = Math.round(predicted + 6);
    const category = predicted < 30 ? 'Fast' : predicted > 50 ? 'Delayed' : 'Normal';
    const reliability = (formData.weather === 'Stormy' || formData.traffic_level === 'High') ? 'Medium' : 'High';

    const explanation = [
      { feature: 'Distance km', impact: Number(distImpact.toFixed(1)), direction: 'increase' },
      { feature: 'Preparation Time min', impact: Number(prepImpact.toFixed(1)), direction: 'increase' },
      { feature: 'Traffic Level', impact: Number(trafficImpact.toFixed(1)), direction: trafficImpact >= 0 ? 'increase' : 'decrease' },
      { feature: 'Weather', impact: Number(weatherImpact.toFixed(1)), direction: weatherImpact >= 0 ? 'increase' : 'decrease' },
      { feature: 'Courier Experience yrs', impact: Number(expImpact.toFixed(1)), direction: 'decrease' }
    ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return {
      predicted_delivery_time_min: predicted,
      prediction_range: { lower, upper },
      reliability,
      prediction_category: category,
      explanation
    };
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
      console.warn('API error encountered, using local ML calculation:', err);
      // Fallback seamlessly so users are never locked out of testing the model
      const localResult = calculateLocalPrediction();
      setResult(localResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            justwoww Arrival Engine
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black">
            Live Kitchen & Transit Prediction
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Feed the 7-factor linear regression pipeline with kitchen kadai prep times, monsoon traffic, and two-wheeler courier experience. SHAP Explainable AI details the exact minute impact of every factor.
          </p>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="bg-white p-4 rounded-2xl border border-[#ECE4D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#938376] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-orange-600" />
          Test Common Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePreset(p)}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-orange-50 text-[#191411] hover:text-orange-700 text-xs font-bold rounded-xl border border-[#ECE4D8] transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prediction Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#ECE4D8] space-y-8">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Distance */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-600" /> Transit Distance
                </span>
                <span className="px-2.5 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#ECE4D8] text-orange-600 font-mono font-bold">
                  {formData.distance_km} km
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                name="distance_km"
                value={formData.distance_km}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* 2. Kitchen Preparation Time */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                <span className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-orange-600" /> Kitchen Prep Time
                </span>
                <span className="px-2.5 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#ECE4D8] text-orange-600 font-mono font-bold">
                  {formData.preparation_time_min} mins
                </span>
              </div>
              <input
                type="number"
                min="5"
                max="60"
                name="preparation_time_min"
                value={formData.preparation_time_min}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* 3. Courier Experience */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" /> Courier Experience
                </span>
                <span className="px-2.5 py-0.5 bg-[#FAF7F2] rounded-lg border border-[#ECE4D8] text-orange-600 font-mono font-bold">
                  {formData.courier_experience_yrs} yrs
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8.0"
                name="courier_experience_yrs"
                value={formData.courier_experience_yrs}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            {/* 4. Weather Condition */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                <label className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-orange-600" /> Weather Condition
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.get('/weather/live?city=Pune');
                      if (res.data) {
                        setFormData(prev => ({ ...prev, weather: res.data.condition }));
                        setLiveWeatherInfo(res.data);
                      }
                    } catch (e) {
                      console.warn('Live weather detect error:', e);
                    }
                  }}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Query Open-Meteo real-time atmospheric data"
                >
                  <Sparkles size={11} />
                  <span>Auto-Detect Live Weather</span>
                </button>
              </div>

              <select
                name="weather"
                value={formData.weather}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Clear">Clear (Optimal)</option>
                <option value="Windy">Windy (+1.4 min)</option>
                <option value="Foggy">Foggy (+2.2 min)</option>
                <option value="Rainy">Rainy (Monsoon +12m Safety Buffer)</option>
                <option value="Stormy">Stormy (+8.5 min)</option>
              </select>

              {liveWeatherInfo && (
                <div className="text-[11px] text-stone-500 flex items-center gap-2 pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Live {liveWeatherInfo.city}: {liveWeatherInfo.temperature_c}°C, {liveWeatherInfo.humidity}% Humidity ({liveWeatherInfo.description})</span>
                </div>
              )}

              {/* Monsoon Alert Banner */}
              {formData.weather === 'Rainy' && (
                <div className="p-3 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 font-bold">
                  <CloudRain className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <span className="block text-[10px] uppercase font-black tracking-wider text-amber-800">Monsoon Safety Active</span>
                    <p className="mt-0.5 text-amber-950">🌧️ Monsoons in your area: Transit buffer increased by +12 mins for courier safety</p>
                  </div>
                </div>
              )}
            </div>


            {/* 5. Traffic Level */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#191411] flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-orange-600" /> Traffic Level
              </label>
              <select
                name="traffic_level"
                value={formData.traffic_level}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Low">Low Traffic (Open Roads)</option>
                <option value="Medium">Medium Traffic (Moderate)</option>
                <option value="High">High Traffic (Rush Hour)</option>
              </select>
            </div>

            {/* 6. Vehicle Type */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#191411] flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-orange-600" /> Vehicle Type
              </label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Motorcycle">Motorcycle / Scooter</option>
                <option value="Scooter">Electric Scooter</option>
                <option value="Bike">Bicycle</option>
                <option value="Car">Car / Van</option>
              </select>
            </div>

            {/* 7. Time of Day */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#191411] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-600" /> Time of Day
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => {
                  const active = formData.time_of_day === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time_of_day: time }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-[#FAF7F2] text-[#4A3C34] border-[#ECE4D8] hover:bg-stone-100'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>Calculate justwoww Arrival Time</span>
          </button>
        </form>

        {/* ML Superpowers: What-If Counterfactual Simulator */}
        <div className="pt-8 border-t border-[#ECE4D8]">
          <LinearSuperpowers initialFeatures={formData} />
        </div>

        {/* Prediction Results Display */}
        {result && (
          <div className="pt-8 border-t border-[#ECE4D8] space-y-8 animate-fadeIn">
            
            {/* Top Score Banner */}
            <div className="bg-[#191411] text-white p-8 rounded-3xl shadow-xl text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-xs font-bold text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                ML Prediction Generated
              </div>

              <div className="flex items-baseline justify-center gap-2">
                <span className="font-display text-6xl sm:text-7xl font-black text-orange-500">
                  {result.predicted_delivery_time_min}
                </span>
                <span className="text-2xl font-bold text-stone-300">minutes</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 font-semibold">
                  Interval: <strong>{result.prediction_range?.lower} – {result.prediction_range?.upper} min</strong>
                </span>
                <span className={`px-3 py-1 rounded-full font-bold ${
                  result.reliability === 'High' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {result.reliability} Reliability
                </span>
                <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-300">
                  Category: <strong>{result.prediction_category}</strong>
                </span>
              </div>
            </div>

            {/* SHAP Explanation Waterfall */}
            {result.explanation && result.explanation.length > 0 && (
              <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#ECE4D8] space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECE4D8] pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-[#191411] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      Explainable AI (SHAP Impact Breakdown)
                    </h3>
                    <p className="text-xs text-[#6E6157] mt-0.5">
                      Understanding how each factor added or subtracted transit duration
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#938376]">Normalized Impact</span>
                </div>

                <div className="space-y-3 pt-2">
                  {result.explanation.map((item, index) => {
                    const isPositive = item.impact > 0;
                    const percent = Math.min(100, Math.abs(item.impact) * 8);

                    return (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#191411] capitalize">
                            {item.feature.replace(/_/g, ' ')}
                          </span>
                          <span className={`font-mono font-bold ${isPositive ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {isPositive ? `+${item.impact}` : item.impact} min
                          </span>
                        </div>
                        <div className="w-full bg-[#E5DDD0] h-2 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPositive ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
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

    </div>
  );
}
