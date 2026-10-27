import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import {
  CreditCard, MapPin, Loader2, CheckCircle, Clock, ShieldCheck,
  ArrowRight, AlertTriangle, BarChart2, Navigation, Compass, Sparkles, Building2,
  Gift, Volume2, CloudRain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Virtual3DMap from '../../components/Virtual3DMap';
import WeatherWidget from '../../components/WeatherWidget';


const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const RELIABILITY_CONFIG = {
  High:   { cls: 'bg-green-100 text-green-700 border-green-200',  icon: ShieldCheck,     label: 'High' },
  Medium: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, label: 'Medium' },
  Low:    { cls: 'bg-red-100 text-red-700 border-red-200',         icon: AlertTriangle,   label: 'Low'  },
};

/**
 * Web Audio API Success Chime
 * Generates an ascending 4-note celebratory chime on order confirmation.
 */
function playOrderSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const start = ctx.currentTime;
    // Ascending celebratory arpeggio: C5, E5, G5, C6
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.32 },
      { freq: 659.25, time: 0.12, dur: 0.32 },
      { freq: 783.99, time: 0.24, dur: 0.35 },
      { freq: 1046.50, time: 0.36, dur: 0.65 }
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, start + n.time);

      gain.gain.setValueAtTime(0.001, start + n.time);
      gain.gain.exponentialRampToValueAtTime(0.32, start + n.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start + n.time);
      osc.stop(start + n.time + n.dur + 0.05);
    });
  } catch (err) {
    console.log('Audio chime not available:', err);
  }
}

/**
 * Live Delivery Countdown Timer with moving courier on road
 */
function DeliveryCountdownTimer({ totalMinutes, estimatedArrival }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(60, Math.round(totalMinutes * 60)));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const totalSecs = Math.max(1, Math.round(totalMinutes * 60));
  const progressPct = Math.min(100, Math.max(0, ((totalSecs - remainingSeconds) / totalSecs) * 100));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Live Delivery Countdown
          </span>
        </div>
        <span className="text-xs text-slate-300 font-medium">
          Expected Arrival: <strong className="text-amber-400 font-mono text-sm">{estimatedArrival}</strong>
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-4xl font-display font-black text-white tracking-tight">
            {mins}:{secs < 10 ? `0${secs}` : secs}
            <span className="text-sm font-normal text-slate-400 ml-2">minutes left</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Kitchen Preparing Order
          </span>
        </div>
      </div>

      {/* Animated Courier Road */}
      <div className="pt-2 relative">
        <div className="w-full bg-slate-700/60 rounded-full h-3.5 overflow-hidden relative border border-slate-600/50">
          <motion.div
            className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-3.5 rounded-full"
            initial={{ width: '4%' }}
            animate={{ width: `${Math.max(6, progressPct)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Courier Mascot moving along the transit road */}
        <div
          className="absolute -top-1.5 transition-all duration-700 transform -translate-x-1/2 text-xl select-none"
          style={{ left: `${Math.max(4, Math.min(96, progressPct))}%` }}
        >
          🛵
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 pt-2 font-medium">
          <span className="flex items-center gap-1">🍳 Kitchen Order</span>
          <span className="flex items-center gap-1">📦 Dispatch</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">🏠 Your Doorstep</span>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { state }    = useLocation();
  const navigate     = useNavigate();
  const [address,  setAddress]    = useState('');
  const [payment,  setPayment]    = useState('cash');
  const [loading,  setLoading]    = useState(false);
  const [confirmed, setConfirmed] = useState(null); // holds {order_id, prediction, distance_km, ...}

  // 3D Virtual Map selection state
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(3.5);
  const [liveWeather, setLiveWeather] = useState(null);

  const handleLocationSelect = useCallback((loc) => {
    setSelectedMapLocation(loc);
    setDistanceKm(loc.distanceKm);
    // Auto-populate address with the virtual district name if user hasn't typed a custom address yet
    setAddress((prev) => {
      if (!prev || prev.includes('Virtual City') || prev.includes('Flat ')) {
        return loc.address;
      }
      return prev;
    });
  }, []);

  if (!state || !state.items || state.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No items in checkout.</p>
        <Link to="/user/restaurants" className="mt-4 inline-block text-blue-600 hover:underline">Browse Restaurants</Link>
      </div>
    );
  }

  const { restaurant_id, items, restaurant_name } = state;
  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // Calculate promotional savings
  const deliveryFeeWaived = 50;
  const chefFestiveDiscount = Math.round(total * 0.12);
  const totalSavings = deliveryFeeWaived + chefFestiveDiscount;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      // Extract EXACT local device time from user's laptop (e.g. 15:32 / 03:32 PM)
      const now = new Date();
      const localHour = now.getHours();
      const localMinute = now.getMinutes();
      const localTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const payload = {
        restaurant_id,
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: address || selectedMapLocation?.address || 'Virtual City Central',
        payment_method:   payment,
        distance_km:      distanceKm,
        user_location:    selectedMapLocation ? { x: selectedMapLocation.x, z: selectedMapLocation.z } : null,
        order_time:       now.toISOString(),
        local_hour:       localHour,
        local_minute:     localMinute,
        local_time_str:   localTimeStr,
        weather_condition: liveWeather?.condition,
        city:             liveWeather?.city || 'Pune',
        override_weather: liveWeather?.condition === 'Rainy' ? 'Rainy' : null
      };

      const res = await axios.post(`${API_URL}/api/orders/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Play victory chime!
      playOrderSuccessChime();

      setConfirmed({
        order_id: res.data.order_id,
        prediction: res.data.prediction,
        distance_km: res.data.distance_km || distanceKm,
        order_time: res.data.order_time || localTimeStr,
        estimated_arrival_time: res.data.estimated_arrival_time || res.data.prediction?.estimated_arrival_time,
        time_of_day: res.data.time_of_day || res.data.prediction?.time_of_day,
        traffic_level: res.data.traffic_level || res.data.prediction?.traffic_level,
        weather: res.data.weather || liveWeather,
        weather_warning: res.data.weather_warning,
        is_raining: res.data.is_raining,
        transit_buffer_min: res.data.transit_buffer_min
      });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };


  /* ── Order Confirmed Screen ── */
  if (confirmed) {
    const pred = confirmed.prediction;
    const rel  = RELIABILITY_CONFIG[pred?.reliability] || RELIABILITY_CONFIG.Medium;
    const RelIcon = rel.icon;

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Animated Confetti & Success Banner */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-emerald-600/20"
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#fef08a', '#f472b6', '#38bdf8', '#fbbf24', '#ffffff'][i % 5],
                  top: `${15 + (i * 7) % 70}%`,
                  left: `${(i * 13) % 95}%`
                }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: [0, 40, 80], opacity: [0, 1, 0] }}
                transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <motion.div
              initial={{ rotate: -25, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-3xl"
            >
              🎉
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-black text-white">Khana Order Placed!</h2>
                <button
                  type="button"
                  onClick={playOrderSuccessChime}
                  title="Replay Celebration Sound"
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <Volume2 size={15} />
                </button>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Order #{confirmed.order_id.slice(0, 8)} · Placed at <strong className="text-white">{confirmed.order_time}</strong> (Your Local Device Time)
              </p>
            </div>
          </div>
        </motion.div>

        {/* How Much You Saved Festive Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 rounded-3xl shadow-lg shadow-orange-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full text-white">
                  justwoww Festive Savings
                </span>
              </div>
              <h3 className="text-xl font-display font-black text-white mt-1">
                You saved ₹{totalSavings} on this order!
              </h3>
              <p className="text-xs text-orange-100">
                ₹{deliveryFeeWaived} Free Delivery waived + ₹{chefFestiveDiscount} Chef's Festive Promo applied
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-right">
            <p className="text-[10px] uppercase font-bold text-orange-100">Total Paid</p>
            <p className="text-lg font-black text-white">₹{total.toLocaleString('en-IN')}</p>
          </div>
        </motion.div>

        {/* Live Delivery Countdown Timer */}
        <DeliveryCountdownTimer
          totalMinutes={pred?.predicted_delivery_time_min || 30}
          estimatedArrival={confirmed.estimated_arrival_time}
        />

        {/* Dynamic Monsoon Road Safety Warning Banner */}
        {(confirmed.is_raining || confirmed.weather_warning) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/80 shadow-xs flex items-start gap-4"
          >
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5">
              <CloudRain className="w-6 h-6 text-amber-700 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                  Monsoon Protocol Active
                </span>
                <span className="text-xs text-amber-800 font-bold">• Courier Road Safety</span>
              </div>
              <h4 className="text-sm font-black text-amber-950">
                {confirmed.weather_warning || "🌧️ Monsoons in your area: Transit buffer increased by +12 mins for courier safety"}
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                Atmospheric conditions in <strong>{confirmed.weather?.city || 'your area'}</strong> detected precipitation. The live countdown timer and clock ETA above already factor in this +12 min wet-road buffer.
              </p>
            </div>
          </motion.div>
        )}

        {/* 3D Map Transit & Timing Summary Card */}

        <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#ECE4D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600/10 text-orange-600 rounded-2xl">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-[#938376] tracking-wider">
                Virtual 3D Route & Time Confirmed
              </p>
              <h4 className="text-sm font-black text-[#191411]">
                {restaurant_name || 'Restaurant Hub'} ➔ {selectedMapLocation?.landmark || 'Drop-off Spot'}
              </h4>
              <p className="text-[11px] text-[#6E6157] mt-0.5">
                Original Time: <strong>{confirmed.order_time}</strong> · Window: <span className="font-semibold text-amber-800">{confirmed.time_of_day}</span> ({confirmed.traffic_level} Traffic)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="px-3.5 py-2 bg-white border border-[#ECE4D8] rounded-xl text-center shadow-xs">
              <p className="text-[10px] uppercase font-bold text-[#938376]">Actual Distance</p>
              <p className="text-base font-black text-orange-600 flex items-center justify-center gap-1">
                <Navigation size={13} className="fill-orange-500 text-orange-500" />
                {confirmed.distance_km || distanceKm} km
              </p>
            </div>

            <div className="px-3.5 py-2 bg-white border border-[#ECE4D8] rounded-xl text-center shadow-xs">
              <p className="text-[10px] uppercase font-bold text-[#938376]">Expected Arrival</p>
              <p className="text-base font-black text-emerald-600 flex items-center justify-center gap-1">
                <Clock size={13} />
                {confirmed.estimated_arrival_time}
              </p>
            </div>
          </div>
        </div>

        {/* ML Prediction card */}
        {pred && (
          <div className="bg-white rounded-3xl border border-[#ECE4D8] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-display font-black text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" /> justwoww AI Delivery Estimate
                </h3>
                <p className="text-orange-100 text-xs mt-0.5">
                  Calculated with 7-factor linear regression ML model using your exact {confirmed.distance_km || distanceKm} km 3D route and {confirmed.time_of_day} time factors
                </p>
              </div>
              <span className="hidden sm:inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold backdrop-blur-xs">
                {confirmed.distance_km || distanceKm} km Path
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Time + Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF7F2] rounded-2xl p-4 text-center border border-[#ECE4D8]">
                  <p className="text-xs text-[#938376] font-bold uppercase tracking-wider mb-1">Estimated Arrival</p>
                  <p className="text-4xl font-display font-black text-orange-600">
                    {Math.round(pred.predicted_delivery_time_min)}
                    <span className="text-lg font-medium text-[#6E6157] ml-1">min</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">
                    Clock ETA: {confirmed.estimated_arrival_time}
                  </p>
                </div>
                <div className="bg-[#FAF7F2] rounded-2xl p-4 text-center border border-[#ECE4D8]">
                  <p className="text-xs text-[#938376] font-bold uppercase tracking-wider mb-1">Expected Interval</p>
                  <p className="text-2xl font-bold text-[#191411]">
                    {Math.round(pred.prediction_range?.lower)} –{' '}
                    {Math.round(pred.prediction_range?.upper)}
                    <span className="text-sm font-medium text-[#6E6157] ml-1">min</span>
                  </p>
                </div>
              </div>

              {/* Reliability */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${rel.cls}`}>
                <RelIcon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">Confidence Reliability: {rel.label}</span>
              </div>

              {/* SHAP Explanation */}
              {pred.explanation && pred.explanation.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-[#938376] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-orange-600" /> Factor Breakdown (SHAP Impact)
                  </p>
                  <div className="space-y-2">
                    {pred.explanation.slice(0, 5).map((exp, i) => {
                      const isPos = exp.impact > 0;
                      const maxImpact = Math.max(...pred.explanation.map(e => Math.abs(e.impact)));
                      const pct = maxImpact > 0 ? (Math.abs(exp.impact) / maxImpact) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs text-[#4A3C34]">
                            <span className="font-semibold">{exp.feature}</span>
                            <span className={`font-mono font-bold ${isPos ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {isPos ? '+' : ''}{exp.impact.toFixed(1)} min
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#E5DDD0] rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${isPos ? 'bg-amber-500' : 'bg-emerald-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/user/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/20"
          >
            Track Garma-Garam Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/user/restaurants"
            className="flex-1 flex items-center justify-center gap-2 bg-white text-[#191411] border border-[#ECE4D8] py-3.5 rounded-xl font-bold text-xs hover:bg-[#FAF7F2] transition-colors"
          >
            Order More Dishes
          </Link>
        </div>
      </div>
    );
  }

  /* ── Checkout Form ── */
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
      {/* Main Interactive Form with 3D Map */}
      <div className="flex-1 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#ECE4D8] space-y-6">
        <div>
          <h2 className="font-display font-black text-2xl text-[#191411]">Complete Your justwoww Order</h2>
          <p className="text-xs text-[#6E6157] mt-1">
            Pick your delivery location on the 3D Virtual Map to calculate transit distance for AI arrival prediction
          </p>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          {/* STEP 1: Virtual 3D Map Location Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#191411] flex items-center gap-1.5">
                <Navigation size={14} className="text-orange-600" />
                Step 1: Pinpoint Delivery Location on 3D Map
              </label>
              <span className="text-[11px] text-orange-600 font-bold flex items-center gap-1">
                <Sparkles size={12} /> {distanceKm} km from {restaurant_name || 'Restaurant'}
              </span>
            </div>

            <Virtual3DMap
              restaurantId={restaurant_id}
              restaurantName={restaurant_name}
              userLocation={selectedMapLocation}
              onLocationSelect={handleLocationSelect}
              height="380px"
            />
          </div>

          {/* STEP 2: Delivery Address Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#191411]">
                Step 2: Confirm Delivery Address
              </label>
              {selectedMapLocation?.landmark && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  📍 {selectedMapLocation.landmark}
                </span>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#938376]" />
              <input
                type="text" required
                value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="e.g. Flat 402, Powai Tech Park, Sector H-4, Virtual City"
              />
            </div>
            <p className="text-[11px] text-[#938376]">
              Auto-linked with your 3D map pin ({distanceKm} km). You can adjust flat/door number as needed.
            </p>
          </div>

          {/* STEP 3: Live Real-World Weather & Atmospheric Telemetry */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#191411] flex items-center gap-1.5">
              <CloudRain size={14} className="text-blue-600" />
              Step 3: Live Real-World Weather & Monsoon Conditions
            </label>
            <WeatherWidget
              city="Pune"
              onWeatherChange={(data) => setLiveWeather(data)}
              showSimulationToggle={true}
            />
          </div>

          {/* STEP 4: Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#191411]">Step 4: Payment Method</label>
            <div className="grid grid-cols-2 gap-3">

              {[
                { val: 'cash', label: '💵 Cash on Delivery' },
                { val: 'card', label: '📱 UPI / Card' },
              ].map(opt => (
                <label
                  key={opt.val}
                  className={`flex items-center gap-2 border rounded-xl px-4 py-3 cursor-pointer text-xs font-bold transition-colors ${
                    payment === opt.val
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-[#ECE4D8] bg-[#FAF7F2] text-[#4A3C34] hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio" name="payment" value={opt.val}
                    checked={payment === opt.val}
                    onChange={() => setPayment(opt.val)}
                    className="hidden"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-[#938376] flex items-center gap-1.5 mb-3">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              Machine learning arrival estimate will use exact <strong>{distanceKm} km</strong> calculated transit distance
            </p>
            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-orange-600/25 cursor-pointer text-xs"
            >
              {loading
                ? <><Loader2 className="animate-spin w-4 h-4" /> Placing your justwoww order...</>
                : `Confirm & Place Order (${distanceKm} km · ₹${total.toLocaleString('en-IN')})`}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Sidebar */}
      <div className="w-full lg:w-80 bg-white p-6 rounded-3xl border border-[#ECE4D8] shadow-sm h-fit space-y-4">
        <h3 className="font-display font-black text-lg text-[#191411]">Order Summary</h3>

        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#ECE4D8] space-y-1">
          <p className="text-[10px] uppercase font-bold text-[#938376]">Ordering From</p>
          <p className="text-xs font-extrabold text-[#191411] flex items-center gap-1.5">
            <Building2 size={13} className="text-orange-600" />
            {restaurant_name || 'justwoww Culinary Hub'}
          </p>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
            <Navigation size={12} className="fill-emerald-600 text-emerald-600" />
            3D Transit: <strong>{distanceKm} km</strong>
          </div>
        </div>

        <div className="space-y-3 pb-4 border-b border-[#ECE4D8]">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-[#6E6157]">{item.quantity}× {item.name}</span>
              <span className="font-bold text-[#191411]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-1 border-t border-[#ECE4D8]/60 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Item Subtotal</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Delivery Fee</span>
            <span className="line-through text-slate-400">₹50</span>
            <span className="font-bold text-emerald-600">FREE</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Festive Chef Promo (12%)</span>
            <span className="font-bold text-emerald-600">-₹{chefFestiveDiscount}</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline font-bold pt-2 border-t border-[#ECE4D8]">
          <span className="text-xs uppercase text-[#938376]">Total Amount</span>
          <span className="font-display text-2xl font-black text-orange-600">₹{total.toLocaleString('en-IN')}</span>
        </div>

        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <p className="text-xs font-bold text-emerald-800">
            🎉 You save ₹{totalSavings} on this order!
          </p>
        </div>
      </div>
    </div>
  );
}
