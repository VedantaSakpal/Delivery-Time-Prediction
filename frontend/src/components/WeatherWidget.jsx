import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CloudRain, Sun, CloudFog, Wind, CloudSnow, AlertTriangle,
  RefreshCw, Compass, Thermometer, Droplets, Gauge, ShieldAlert
} from 'lucide-react';

export default function WeatherWidget({
  city = 'Pune',
  onWeatherChange,
  showSimulationToggle = true,
  compact = false
}) {
  const [selectedCity, setSelectedCity] = useState(city);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRain, setSimulatedRain] = useState(false);

  const fetchWeather = async (targetCity, override = null) => {
    setLoading(true);
    try {
      const params = {
        city: targetCity || selectedCity,
        ...(override ? { override } : {})
      };
      const res = await api.get('/weather/live', { params });
      setWeatherData(res.data);
      if (onWeatherChange) {
        onWeatherChange(res.data);
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity, simulatedRain ? 'Rainy' : null);
  }, [selectedCity, simulatedRain]);

  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
    fetchWeather(newCity, simulatedRain ? 'Rainy' : null);
  };

  const toggleSimulation = () => {
    const nextState = !simulatedRain;
    setSimulatedRain(nextState);
    fetchWeather(selectedCity, nextState ? 'Rainy' : null);
  };

  const getWeatherIcon = (cond) => {
    switch (cond) {
      case 'Rainy':
        return <CloudRain className="w-5 h-5 text-blue-500 animate-bounce" />;
      case 'Foggy':
        return <CloudFog className="w-5 h-5 text-stone-500" />;
      case 'Windy':
        return <Wind className="w-5 h-5 text-teal-600" />;
      case 'Snowy':
        return <CloudSnow className="w-5 h-5 text-cyan-500" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />;
    }
  };

  if (!weatherData && loading) {
    return (
      <div className="p-4 bg-white/70 border border-[#ECE4D8] rounded-2xl flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
          <span>Polling Open-Meteo real-time atmospheric telemetry...</span>
        </div>
      </div>
    );
  }

  const isRaining = weatherData?.is_raining || simulatedRain;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ECE4D8] rounded-xl text-xs shadow-xs">
        {getWeatherIcon(weatherData?.condition)}
        <span className="font-bold text-stone-800">{weatherData?.temperature_c}°C</span>
        <span className="text-stone-400">•</span>
        <span className="text-stone-600">{weatherData?.description}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Meteorological Card */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isRaining 
          ? 'bg-gradient-to-br from-blue-50/80 via-amber-50/40 to-white border-blue-300 shadow-md' 
          : 'bg-white border-[#ECE4D8] shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ECE4D8]/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              isRaining ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {getWeatherIcon(weatherData?.condition)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                  Live Meteorological Telemetry
                </span>
                <span className="text-[10px] text-stone-400">• Real-Time API</span>
              </div>
              <h4 className="font-display font-black text-base text-[#191411] flex items-center gap-2">
                <span>{weatherData?.full_city || 'Pune, Maharashtra'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isRaining ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {weatherData?.condition}
                </span>
              </h4>
            </div>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={selectedCity.toLowerCase()}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="pune">Pune</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi NCR</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="kolkata">Kolkata</option>
              <option value="chennai">Chennai</option>
            </select>

            <button
              type="button"
              onClick={() => fetchWeather(selectedCity, simulatedRain ? 'Rainy' : null)}
              disabled={loading}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              title="Refresh live atmospheric data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-3 text-center">
          <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#ECE4D8]/70">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-stone-400 uppercase">
              <Thermometer className="w-3 h-3 text-amber-600" />
              <span>Temp</span>
            </div>
            <p className="text-base font-black text-stone-800 mt-0.5">{weatherData?.temperature_c}°C</p>
          </div>

          <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#ECE4D8]/70">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-stone-400 uppercase">
              <Droplets className="w-3 h-3 text-blue-600" />
              <span>Humidity</span>
            </div>
            <p className="text-base font-black text-stone-800 mt-0.5">{weatherData?.humidity}%</p>
          </div>

          <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#ECE4D8]/70">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-stone-400 uppercase">
              <Wind className="w-3 h-3 text-teal-600" />
              <span>Wind</span>
            </div>
            <p className="text-base font-black text-stone-800 mt-0.5">{weatherData?.wind_speed_kmh} <span className="text-[10px] font-normal text-stone-400">km/h</span></p>
          </div>

          <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#ECE4D8]/70 col-span-3 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-stone-400 uppercase">
              <CloudRain className="w-3 h-3 text-blue-600" />
              <span>Precip</span>
            </div>
            <p className="text-base font-black text-stone-800 mt-0.5">{weatherData?.precipitation_mm} <span className="text-[10px] font-normal text-stone-400">mm</span></p>
          </div>
        </div>

        {/* Demo Simulation Toggle */}
        {showSimulationToggle && (
          <div className="mt-4 pt-3 border-t border-[#ECE4D8]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 font-medium text-[11px]">
              Want to see how rain affects ETA predictions?
            </span>
            <button
              type="button"
              onClick={toggleSimulation}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto ${
                simulatedRain
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>{simulatedRain ? 'Disable Rain Simulation' : '⚡ Simulate Monsoon Rain (+12m)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Warning Banner when Raining */}
      {isRaining && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/70 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
            <CloudRain className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                Monsoon Transit Notice
              </span>
              <span className="text-xs text-amber-800 font-bold">• Courier Safety Protocol Active</span>
            </div>
            <p className="text-xs font-bold text-amber-950 leading-relaxed">
              🌧️ Monsoons in your area: Transit buffer increased by +12 mins for courier safety
            </p>
            <p className="text-[11px] text-amber-800">
              Wet tarmac and reduced visibility trigger safe driving speed limits on bike couriers. The AI prediction model has factored this delay into your expected arrival window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
