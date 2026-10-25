import { useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import {
  CreditCard, MapPin, Loader2, CheckCircle, Clock, ShieldCheck,
  ArrowRight, AlertTriangle, BarChart2, Navigation, Compass, Sparkles, Building2
} from 'lucide-react';
import Virtual3DMap from '../../components/Virtual3DMap';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const RELIABILITY_CONFIG = {
  High:   { cls: 'bg-green-100 text-green-700 border-green-200',  icon: ShieldCheck,     label: 'High' },
  Medium: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, label: 'Medium' },
  Low:    { cls: 'bg-red-100 text-red-700 border-red-200',         icon: AlertTriangle,   label: 'Low'  },
};

export default function Checkout() {
  const { state }    = useLocation();
  const navigate     = useNavigate();
  const [address,  setAddress]    = useState('');
  const [payment,  setPayment]    = useState('cash');
  const [loading,  setLoading]    = useState(false);
  const [confirmed, setConfirmed] = useState(null); // holds {order_id, prediction, distance_km}

  // 3D Virtual Map selection state
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(3.5);

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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const payload = {
        restaurant_id,
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: address || selectedMapLocation?.address || 'Virtual City Central',
        payment_method:   payment,
        distance_km:      distanceKm,
        user_location:    selectedMapLocation ? { x: selectedMapLocation.x, z: selectedMapLocation.z } : null
      };

      const res = await axios.post(`${API_URL}/api/orders/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfirmed({
        order_id: res.data.order_id,
        prediction: res.data.prediction,
        distance_km: res.data.distance_km || distanceKm
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
      <div className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        {/* Success banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-center gap-4">
          <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0" />
          <div>
            <h2 className="font-display text-xl font-black text-emerald-950">Khana Order Placed!</h2>
            <p className="text-xs text-emerald-700 mt-0.5">
              Order #{confirmed.order_id.slice(0, 8)} · The kitchen has started warming up the kadai.
            </p>
          </div>
        </div>

        {/* 3D Map Transit Summary Card */}
        <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#ECE4D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600/10 text-orange-600 rounded-2xl">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold text-[#938376] tracking-wider">
                Virtual 3D Map Route Confirmed
              </p>
              <h4 className="text-sm font-black text-[#191411]">
                {restaurant_name || 'Restaurant Hub'} ➔ {selectedMapLocation?.landmark || 'Drop-off Spot'}
              </h4>
              <p className="text-[11px] text-[#6E6157] mt-0.5">
                Dispatch point linked to 3D virtual coordinates (X: {Math.round(selectedMapLocation?.x || 0)}, Z: {Math.round(selectedMapLocation?.z || 0)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-4 py-2 bg-white border border-[#ECE4D8] rounded-xl text-center shadow-xs">
              <p className="text-[10px] uppercase font-bold text-[#938376]">Actual Distance</p>
              <p className="text-lg font-black text-orange-600 flex items-center justify-center gap-1">
                <Navigation size={14} className="fill-orange-500 text-orange-500" />
                {confirmed.distance_km || distanceKm} km
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
                  <Clock className="w-5 h-5" /> Zaika AI Delivery Estimate
                </h3>
                <p className="text-orange-100 text-xs mt-0.5">
                  Calculated with 7-factor linear regression ML model using your exact {confirmed.distance_km || distanceKm} km 3D route
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
          <h2 className="font-display font-black text-2xl text-[#191411]">Complete Your Zaika Order</h2>
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

          {/* STEP 3: Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#191411]">Step 3: Payment Method</label>
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
                ? <><Loader2 className="animate-spin w-4 h-4" /> Placing your Zaika order...</>
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
            {restaurant_name || 'Zaika Culinary Hub'}
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

        <div className="flex justify-between items-baseline font-bold">
          <span className="text-xs uppercase text-[#938376]">Total Amount</span>
          <span className="font-display text-2xl font-black text-orange-600">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
