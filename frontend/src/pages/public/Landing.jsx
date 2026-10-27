import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../components/Logo';
import {
  Clock, MapPin, Bike, Navigation, Utensils, Flame, Sparkles, ChefHat,
  ShieldCheck, ArrowRight, Star, CheckCircle2, ChevronRight, Zap,
  Sliders, Truck, Sun, CloudRain, Wind, CloudFog, CloudLightning,
  Car, Activity, Store, User, ShoppingBag, Heart, Coffee
} from 'lucide-react';

const FOOD_CATEGORIES = [
  {
    id: 'biryani',
    name: 'Dum Biryani',
    emoji: '🍲',
    dish: 'Royal Hyderabadi Mutton Dum Biryani',
    restaurant: 'Hyderabadi Dastarkhwan',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80',
    basePrep: 18,
    rating: 4.9,
    reviews: 3420,
    price: '₹399',
    story: 'Kachchi gosht layered with 2-year aged Daawat basmati, real saffron, mint, and slow dum over coal embers.'
  },
  {
    id: 'north-indian',
    name: 'Butter Chicken & Naan',
    emoji: '🫓',
    dish: 'Old Delhi Butter Chicken & Garlic Naan',
    restaurant: 'Punjab Grill & Rasoi',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1000&q=80',
    basePrep: 16,
    rating: 4.9,
    reviews: 2150,
    price: '₹360',
    story: 'Charcoal-grilled tandoori chicken simmered in a silky tomato, cashew cream, and churned butter gravy.'
  },
  {
    id: 'south-indian',
    name: 'Crispy Dosa & Idli',
    emoji: '🥘',
    dish: 'Mysore Ghee Roast Masala Dosa',
    restaurant: 'Dakshin Tiffin House',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1000&q=80',
    basePrep: 12,
    rating: 4.8,
    reviews: 1980,
    price: '₹160',
    story: 'Crisp golden crepe smeared with spicy red garlic chutney, filled with potato sabzi and served with drumstick sambar.'
  },
  {
    id: 'chaat',
    name: 'Mumbai Pav Bhaji & Chaat',
    emoji: '🍢',
    dish: 'Chowpatty Special Butter Pav Bhaji',
    restaurant: 'Chowpatty Street Chaat Co.',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=1000&q=80',
    basePrep: 10,
    rating: 4.9,
    reviews: 1640,
    price: '₹160',
    story: 'Spiced mash of cauliflower, green peas, and potatoes topped with a slab of golden Amul butter and soft toasted pavs.'
  },
  {
    id: 'kebabs',
    name: 'Tandoori & Kebabs',
    emoji: '🍗',
    dish: 'Melt-in-Mouth Lucknowi Galouti Kebabs',
    restaurant: 'Dilli 6 Kebabs & Tandoor',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=1000&q=80',
    basePrep: 15,
    rating: 4.9,
    reviews: 1420,
    price: '₹320',
    story: 'Finely minced meat infused with 32 royal Awadhi spices and raw papaya, grilled gently and served on Ulta Tawa parathas.'
  },
  {
    id: 'mithai',
    name: 'Garma-Garam Mithai',
    emoji: '🍮',
    dish: 'Kesar Jalebi with Thick Cream Rabdi',
    restaurant: 'Bikaneri Sweet & Snacks',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=80',
    basePrep: 8,
    rating: 4.9,
    reviews: 2450,
    price: '₹150',
    story: 'Piping hot crispy spiral jalebis dipped in saffron syrup, served alongside chilled malai rabdi and sliced pistachios.'
  }
];

const LIVE_ORDERS_TICKER = [
  "🍲 Rohan's Mutton Dum Biryani delivered in 22 min to Koramangala, Bengaluru",
  "🫓 Garma-Garam Butter Chicken & Naan dispatched to Connaught Place, New Delhi",
  "🥘 Mysore Ghee Roast Masala Dosa delivered hot to Indiranagar, Bengaluru",
  "🍢 Extra Butter Pav Bhaji delivered 4 min early to Bandra West, Mumbai",
  "🍗 Melt-in-Mouth Galouti Kebabs out with Courier Arjun (3.8 yrs exp)",
  "🍮 Kesar Jalebis with Rabdi dispatched fresh in Gomti Nagar, Lucknow",
  "☕ Filter Kaapi & Podi Idli delivered in 14 min to T. Nagar, Chennai"
];

const FEATURED_KITCHENS = [
  {
    name: "Hyderabadi Dastarkhwan",
    cuisine: "Biryani • Mughlai Speciality",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews: 3420,
    distanceKm: 3.5,
    prepTime: 18,
    tag: "Authentic Dum",
    signature: "Mutton Dum Biryani & Mirchi Ka Salan"
  },
  {
    name: "Punjab Grill & Rasoi",
    cuisine: "North Indian • Tandoor & Curries",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews: 2150,
    distanceKm: 2.8,
    prepTime: 20,
    tag: "16-hr Dal Makhani",
    signature: "Butter Chicken & Stuffed Kulchas"
  },
  {
    name: "Dakshin Tiffin House",
    cuisine: "South Indian • Traditional Breakfast",
    image: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviews: 1980,
    distanceKm: 1.9,
    prepTime: 12,
    tag: "Pure Desi Ghee",
    signature: "Ghee Roast Dosa & Degree Filter Kaapi"
  },
  {
    name: "Chowpatty Street Chaat Co.",
    cuisine: "Mumbai Street Food • Chaat & Snacks",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews: 1640,
    distanceKm: 2.2,
    prepTime: 10,
    tag: "Amul Butter Loaded",
    signature: "Special Pav Bhaji & Dahi Papdi Chaat"
  }
];

export default function Landing() {
  const { user, isAdmin, isRestaurant, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(FOOD_CATEGORIES[0]);

  // Interactive Live Estimator State (Indian Traffic & Monsoons calibrated)
  const [distance, setDistance] = useState(3.8);
  const [weather, setWeather] = useState('Clear');
  const [traffic, setTraffic] = useState('Medium');
  const [prepTime, setPrepTime] = useState(15);
  const [vehicle, setVehicle] = useState('Motorcycle');
  const [courierExp, setCourierExp] = useState(3.0);

  // Responsive ML Calculation
  const liveEstimate = useMemo(() => {
    let baseTime = 18.5;
    const distImpact = distance * 1.85;
    const prepImpact = prepTime * 0.72;
    
    let weatherImpact = 0;
    if (weather === 'Rainy') weatherImpact = 5.2; // Monsoon delays
    else if (weather === 'Stormy') weatherImpact = 9.0;
    else if (weather === 'Foggy') weatherImpact = 2.4;
    else if (weather === 'Windy') weatherImpact = 1.4;
    else if (weather === 'Clear') weatherImpact = -1.2;

    let trafficImpact = 0;
    if (traffic === 'High') trafficImpact = 8.0; // Peak Indian metro traffic
    else if (traffic === 'Medium') trafficImpact = 2.5;
    else if (traffic === 'Low') trafficImpact = -2.0;

    let vehicleImpact = 0;
    if (vehicle === 'Bicycle') vehicleImpact = 5.5;
    else if (vehicle === 'Motorcycle' || vehicle === 'Scooter') vehicleImpact = -1.8; // Agile two-wheelers in traffic
    else if (vehicle === 'Car') vehicleImpact = 3.5;

    const expImpact = -Math.min(courierExp * 0.85, 4.5);
    const totalMinutes = Math.max(12, Math.round(baseTime + distImpact + prepImpact + weatherImpact + trafficImpact + vehicleImpact + expImpact));
    const lower = Math.max(10, Math.round(totalMinutes - (weather === 'Stormy' || traffic === 'High' ? 6 : 4)));
    const upper = Math.round(totalMinutes + (weather === 'Stormy' || traffic === 'High' ? 7 : 4));

    const reliability = (weather === 'Stormy' || traffic === 'High') ? 'Moderate' : 'High';

    const shapFactors = [
      { label: 'Fresh Tandoor / Handi Prep', mins: prepImpact, detail: `${prepTime} min cooking`, positive: true },
      { label: 'Road Travel Distance', mins: distImpact, detail: `${distance.toFixed(1)} km transit`, positive: true },
      { label: 'Metro Traffic Density', mins: trafficImpact, detail: `${traffic} peak traffic`, positive: trafficImpact >= 0 },
      { label: 'Weather & Monsoon Factor', mins: weatherImpact, detail: `${weather} weather`, positive: weatherImpact >= 0 },
      { label: 'Experienced Delivery Rider', mins: expImpact, detail: `${courierExp.toFixed(1)} yrs city experience`, positive: false }
    ].sort((a, b) => Math.abs(b.mins) - Math.abs(a.mins));

    return { totalMinutes, lower, upper, reliability, shapFactors };
  }, [distance, weather, traffic, prepTime, vehicle, courierExp]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <span className="font-serif italic text-stone-700 text-lg">Garma-Garam food ready ho raha hai...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] selection:bg-orange-500 selection:text-white">

      {/* ============================================================== */}
      {/* 1. TOP ACCESS BAR: THREE LOGINS DISPLAYED PROMINENTLY AT TOP   */}
      {/* ============================================================== */}
      <div className="bg-[#191411] text-stone-300 py-2.5 px-4 sm:px-6 lg:px-8 border-b border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          
          {/* Live Kitchen Network Status */}
          <div className="flex items-center gap-2 text-stone-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-[11px] sm:text-xs">
              <strong>Desi Kitchens Online:</strong> 48 Iconic Rasois Cooking Now in Your City
            </span>
          </div>

          {/* THE THREE LOGINS PROMINENTLY DISPLAYED AT TOP */}
          <div className="flex items-center flex-wrap justify-center gap-2">
            <span className="text-stone-500 text-[10px] uppercase font-bold tracking-widest mr-1">
              Select Portal:
            </span>

            {/* LOGIN 1: DINER / CUSTOMER */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-orange-600 text-white rounded-lg border border-stone-700 hover:border-orange-500 transition-all font-bold text-[11px] shadow-xs group"
            >
              <User className="w-3.5 h-3.5 text-orange-400 group-hover:text-white transition-colors" />
              <span>Diner Login</span>
            </Link>

            {/* LOGIN 2: RESTAURANT / RASOI PARTNER */}
            <Link
              to="/restaurant/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-950/80 hover:bg-amber-700 text-amber-200 hover:text-white rounded-lg border border-amber-800/80 hover:border-amber-600 transition-all font-bold text-[11px] shadow-xs group"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400 group-hover:text-white transition-colors" />
              <span>Restaurant Partner Login</span>
            </Link>

            {/* LOGIN 3: FLEET ADMIN */}
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 transition-all font-bold text-[11px] shadow-xs group"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 group-hover:text-white transition-colors" />
              <span>Admin Login</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CULINARY NAVBAR WITH INDIAN BRANDING: JUSTWOWW            */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#ECE4D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Mark */}
          <Logo size="md" tagline="Instant Food • Punctual Delivery" to="/" />

          {/* Menu Anchors */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#4A3C34]">
            <a href="#story" className="hover:text-orange-600 transition-colors">Our Promise</a>
            <a href="#estimator" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-600" />
              Arrival Timer
            </a>
            <a href="#eateries" className="hover:text-orange-600 transition-colors">Local Rasois</a>
            <a href="#portals" className="hover:text-orange-600 transition-colors">Gateways</a>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-block px-4 py-2 text-xs font-bold text-[#4A3C34] hover:text-orange-600 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-600/20 hover:shadow-orange-600/35 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Order Food</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {isRestaurant && (
                  <Link
                    to="/restaurant/dashboard"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    Kitchen Console
                  </Link>
                )}
                {!isRestaurant && !isAdmin && (
                  <Link
                    to="/user/dashboard"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Orders
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>

        {/* 3. SUBTLE ANIMATED REAL-TIME DELIVERY TICKER */}
        <div className="bg-[#FAF4EB] border-t border-[#ECE4D8] overflow-hidden py-2 text-xs text-[#6E6157]">
          <div className="marquee-container">
            <div className="marquee-content flex items-center gap-8">
              {LIVE_ORDERS_TICKER.concat(LIVE_ORDERS_TICKER).map((text, idx) => (
                <div key={idx} className="flex items-center gap-3 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="font-medium text-stone-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 4. HERO SECTION: INDIAN CULINARY SOUL & REAL TIME PREDICTION   */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="absolute top-12 left-1/3 w-[600px] h-[360px] bg-gradient-to-tr from-amber-400/20 via-orange-300/15 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Narrative Column */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Authenticity Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ECE4D8] shadow-xs text-xs font-bold text-[#191411]">
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Asli Desi Flavors • Smart Routing</span>
                <span className="text-[#ECE4D8]">|</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Garma-Garam Guarantee
                </span>
              </div>

              {/* Editorial Headline */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#191411] leading-[1.08]">
                Garma-Garam Asli justwoww, <br />
                <span className="editorial-italic text-orange-600 font-normal">
                  exact time pe.
                </span>
              </h1>

              {/* Thoughtful, Human Subtitle */}
              <p className="text-lg sm:text-xl text-[#5C4F44] max-w-2xl font-normal leading-relaxed">
                Thandi biryani aur soggy dosas ko bolo bye-bye. justwoww brings you iconic neighborhood rasois and tandoors with smart arrival forecasting — so your food leaves the kadhai and reaches your table piping hot.
              </p>

              {/* Dynamic Indian Cravings Category Chips */}
              <div className="pt-2">
                <p className="text-xs uppercase font-extrabold tracking-wider text-[#938376] mb-3 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-orange-600" />
                  Aapka craving aaj kya hai?
                </p>
                <div className="flex flex-wrap gap-2">
                  {FOOD_CATEGORIES.map((cat) => {
                    const active = selectedCategory.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          active
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-105'
                            : 'bg-white hover:bg-[#F3ECE0] text-[#4A3C34] border border-[#ECE4D8]'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to={user ? "/user/restaurants" : "/login"}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-600/25 hover:shadow-orange-600/40 text-center transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Order from {selectedCategory.restaurant}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#estimator"
                  className="px-6 py-4 bg-white hover:bg-[#F3ECE0] text-[#191411] font-bold rounded-2xl border border-[#ECE4D8] shadow-xs text-center transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>Calculate Delivery ETA</span>
                </a>
              </div>

              {/* Three Culinary Pillars */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#ECE4D8] max-w-lg">
                <div>
                  <div className="font-serif text-2xl font-bold text-[#191411]">98.4%</div>
                  <div className="text-xs text-[#6E6157]">On-Time Arrival</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-orange-600">±2 min</div>
                  <div className="text-xs text-[#6E6157]">Arrival Precision</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-emerald-700">Kadhai-Sync</div>
                  <div className="text-xs text-[#6E6157]">Never Cold on Counter</div>
                </div>
              </div>

            </motion.div>

            {/* Right Culinary Visual Column (Animated Order Journey) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md">
                
                {/* Food Showcase Card */}
                <div className="relative rounded-3xl overflow-hidden bg-white shadow-2xl border border-[#ECE4D8] p-3">
                  
                  {/* Photo with subtle steam indicator */}
                  <div className="relative h-72 w-full rounded-2xl overflow-hidden bg-stone-100">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedCategory.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        src={selectedCategory.image}
                        alt={selectedCategory.dish}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Freshly Cooked Badge */}
                    <div className="absolute top-4 right-4 bg-orange-600/95 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow">
                      <Flame className="w-3.5 h-3.5 animate-bounce" />
                      <span>Garma-Garam</span>
                    </div>

                    {/* Restaurant badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#191411] shadow flex items-center gap-1.5">
                      <span>{selectedCategory.emoji}</span>
                      <span>{selectedCategory.restaurant}</span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-xl leading-tight">
                          {selectedCategory.dish}
                        </h3>
                        <span className="font-bold text-amber-300 text-lg">{selectedCategory.price}</span>
                      </div>
                      <p className="text-xs text-stone-200 mt-1 line-clamp-1 italic">
                        {selectedCategory.story}
                      </p>
                    </div>
                  </div>

                  {/* Simulated Live Order Telemetry Card */}
                  <div className="mt-3 p-4 bg-[#FAF7F2] rounded-2xl border border-[#ECE4D8] space-y-3">
                    
                    {/* Animated Delivery Route Stepper */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-[#6E6157]">
                        <span className="text-orange-600 font-extrabold flex items-center gap-1">
                          <ChefHat className="w-3.5 h-3.5" /> In Kadhai / Handi
                        </span>
                        <span className="text-[#191411] flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-orange-600" /> Rider En Route
                        </span>
                        <span className="text-[#938376] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Ghar Pe
                        </span>
                      </div>

                      {/* Moving Courier Progress Bar */}
                      <div className="relative w-full h-2 bg-[#E5DDD0] rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: ["30%", "72%", "30%"] }}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Estimated Arrival Window Meter */}
                    <div className="p-3.5 bg-white rounded-xl border border-[#ECE4D8] shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#938376] tracking-wider block">
                          Promised Arrival Window
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif text-3xl font-bold text-orange-600">20 - 24</span>
                          <span className="text-xs font-bold text-[#4A3C34]">minutes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md inline-block">
                          ★ High Accuracy
                        </span>
                        <p className="text-[10px] text-[#6E6157] mt-1">Dispatched to match tandoor timing</p>
                      </div>
                    </div>

                    {/* Real-time Transit Factoids */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-[#ECE4D8] text-[#4A3C34] flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Clear roads: <strong>-1.5 min</strong></span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-[#ECE4D8] text-[#4A3C34] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Rider Arjun (3.5 yrs exp)</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Floating Delight Pill 1 */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-5 -left-5 bg-white p-3 rounded-2xl shadow-xl border border-[#ECE4D8] flex items-center gap-2.5 z-20"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <Heart className="w-4 h-4 fill-orange-500 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#191411]">18,000+ Desi Foodies</p>
                    <p className="text-[10px] text-[#6E6157]">Rated 4.9 on piping-hot delivery</p>
                  </div>
                </motion.div>

                {/* Floating Delight Pill 2 */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-[#191411] text-white p-3 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-2 z-20"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold">Rasoi-to-Rider Sync</span>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. INTERACTIVE LIVE DELIVERY ESTIMATOR: HONEST & INTUITIVE      */}
      {/* ============================================================== */}
      <section id="estimator" className="py-20 bg-white border-y border-[#ECE4D8] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              Live Arrival Calculator
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#191411]">
              See why your dinner never arrives cold or delayed.
            </h2>
            <p className="text-[#6E6157] text-base sm:text-lg">
              Adjust distance, weather, peak city traffic, and cooking time. Watch how every factor transparently shapes your meal's arrival window.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Controls */}
            <div className="lg:col-span-7 bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#ECE4D8] shadow-xs space-y-6">
              
              <div className="flex items-center justify-between border-b border-[#ECE4D8] pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-orange-600" />
                  <h3 className="font-serif font-bold text-xl text-[#191411]">Simulate Order Conditions</h3>
                </div>
                <span className="text-xs text-[#6E6157]">Trained on 45,000+ Indian city deliveries</span>
              </div>

              {/* Slider: Distance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" /> Delivery Distance
                  </span>
                  <span className="px-3 py-1 bg-white rounded-lg border border-[#ECE4D8] font-bold text-orange-600">
                    {distance.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="18"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#E5DDD0] rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[11px] text-[#938376]">
                  <span>0.5 km (Colony / Gali)</span>
                  <span>9 km</span>
                  <span>18 km (Across City)</span>
                </div>
              </div>

              {/* Slider: Kitchen Prep Time */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-[#191411]">
                  <span className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-orange-600" /> Kitchen Cooking Time
                  </span>
                  <span className="px-3 py-1 bg-white rounded-lg border border-[#ECE4D8] font-bold text-orange-600">
                    {prepTime} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="40"
                  step="1"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#E5DDD0] rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[11px] text-[#938376]">
                  <span>6 min (Chaat / Chai)</span>
                  <span>18 min (Dosa / Biryani)</span>
                  <span>40 min (Slow Handi Dum)</span>
                </div>
              </div>

              {/* Weather Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191411] flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-600" /> Weather & Skies
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'Clear', label: 'Clear', icon: Sun },
                    { id: 'Windy', label: 'Windy', icon: Wind },
                    { id: 'Foggy', label: 'Winter Fog', icon: CloudFog },
                    { id: 'Rainy', label: 'Monsoon Rain', icon: CloudRain },
                    { id: 'Stormy', label: 'Heavy Thunder', icon: CloudLightning }
                  ].map((w) => {
                    const Icon = w.icon;
                    const active = weather === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWeather(w.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                            : 'bg-white hover:bg-stone-50 text-[#4A3C34] border-[#ECE4D8]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Traffic Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191411] flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-orange-600" /> City Traffic Conditions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Low', label: 'Open Roads', desc: '-2.0 min' },
                    { id: 'Medium', label: 'Moderate Flow', desc: '+2.5 min' },
                    { id: 'High', label: 'Peak Rush Hour', desc: '+8.0 min' }
                  ].map((t) => {
                    const active = traffic === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTraffic(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-white border-orange-600 ring-2 ring-orange-500/20 shadow-xs'
                            : 'bg-white hover:bg-stone-50 border-[#ECE4D8]'
                        }`}
                      >
                        <p className={`text-xs font-bold ${active ? 'text-orange-600' : 'text-[#191411]'}`}>
                          {t.label}
                        </p>
                        <p className="text-[11px] text-[#938376] mt-0.5">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Live Transparent Results Console */}
            <div className="lg:col-span-5 bg-[#191411] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-800 space-y-6">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                    Live Forecast
                  </span>
                </div>
                <span className="text-xs text-stone-400">Punctual Arrival</span>
              </div>

              {/* Big Estimated Arrival Time Counter */}
              <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 text-center space-y-2">
                <span className="text-xs uppercase font-bold text-stone-400 tracking-wider">
                  Estimated Delivery Window
                </span>
                
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-serif text-6xl sm:text-7xl font-bold text-orange-500 tracking-tight">
                    {liveEstimate.totalMinutes}
                  </span>
                  <span className="text-2xl font-serif text-stone-300">minutes</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800 text-xs font-semibold text-stone-300">
                  <span>Arrival: <strong>{liveEstimate.lower} – {liveEstimate.upper} min</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">
                    {liveEstimate.reliability} Confidence
                  </span>
                </div>
              </div>

              {/* Honest Factor Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Transparent Minutes Breakdown
                  </h4>
                  <span className="text-[11px] text-stone-500">Impact</span>
                </div>

                <div className="space-y-2.5">
                  {liveEstimate.shapFactors.map((f, idx) => {
                    const isPositive = f.mins >= 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-300 font-medium">{f.label} ({f.detail})</span>
                          <span className={`font-mono font-bold ${isPositive ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isPositive ? `+${f.mins.toFixed(1)}` : f.mins.toFixed(1)} min
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPositive ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.abs(f.mins) * 6.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={user ? "/user/restaurants" : "/login"}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2 block"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Order Now with Guaranteed ETA</span>
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. OUR PROMISE: HOW IT WORKS (DESI FOOD STORYTELLING)          */}
      {/* ============================================================== */}
      <section id="story" className="py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              Punctual & Authentic
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#191411]">
              The Secret Behind Truly Garma-Garam Delivery.
            </h2>
            <p className="text-[#6E6157] text-base sm:text-lg">
              Most delivery apps leave food sitting under counters while looking for a rider. We sync kitchen handi & tandoor timing with rider approach so food goes straight from fire into transit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Order Iconic Desi Dishes',
                desc: 'Select from legendary biryani houses, tandoors, tiffin joints, and sweet shops.',
                icon: Utensils,
                badge: 'Curated Rasois'
              },
              {
                step: '02',
                title: 'Kadhai-to-Rider Sync',
                desc: 'The chef fires your dish exactly when the delivery partner is on the final 3-minute approach.',
                icon: ChefHat,
                badge: 'Zero Idle Time'
              },
              {
                step: '03',
                title: 'Monsoon & Traffic Pacing',
                desc: 'Live traffic congestion and rain conditions dynamically calculate the exact transit window.',
                icon: Navigation,
                badge: 'Live Adjustments'
              },
              {
                step: '04',
                title: 'Steaming Hot at Doorstep',
                desc: 'Enjoy piping hot food with fresh aromas intact, delivered within the estimated minute.',
                icon: CheckCircle2,
                badge: 'Asli justwoww'
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-7 rounded-3xl border border-[#ECE4D8] shadow-xs hover:shadow-lg transition-all duration-300 relative space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-serif text-3xl font-bold text-[#E5DDD0]">{card.step}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">
                      {card.badge}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#191411] mt-1">{card.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#6E6157] leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. FEATURED LOCAL KITCHENS SHOWCASE (INDIAN RASOIS)            */}
      {/* ============================================================== */}
      <section id="eateries" className="py-20 bg-white border-t border-[#ECE4D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600">
                Iconic Eateries
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#191411] mt-1">
                Featured Kitchen Partners
              </h2>
            </div>
            <Link
              to={user ? "/user/restaurants" : "/login"}
              className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group"
            >
              <span>Explore all curated rasois</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_KITCHENS.map((rest, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl overflow-hidden border border-[#ECE4D8] shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden bg-stone-100">
                  <img
                    src={rest.image}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#191411]/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {rest.tag}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 px-2 py-0.5 rounded-lg text-xs font-bold text-[#191411] flex items-center gap-1 shadow">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rest.rating}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#191411] group-hover:text-orange-600 transition-colors">
                      {rest.name}
                    </h3>
                    <p className="text-xs text-[#6E6157] mt-0.5">{rest.cuisine}</p>
                    <p className="text-xs font-semibold text-orange-800 bg-orange-50 px-2 py-1 rounded-md mt-2 inline-block">
                      ★ {rest.signature}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#ECE4D8] flex items-center justify-between text-xs text-[#6E6157]">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {rest.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#191411]">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      ~{rest.prepTime + Math.round(rest.distanceKm * 2)} min ETA
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. PORTALS SECTION: FULL PLATFORM GATEWAYS                     */}
      {/* ============================================================== */}
      <section id="portals" className="py-24 bg-[#FAF7F2] border-t border-[#ECE4D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              Connected Platform
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#191411]">
              Three Tailored Portals
            </h2>
            <p className="text-[#6E6157] text-base sm:text-lg">
              Dedicated interfaces designed for hungry diners, high-volume kitchen partners, and fleet controllers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* PORTAL 1: CUSTOMER */}
            <div className="bg-white rounded-3xl p-8 border border-[#ECE4D8] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">For Diners</span>
                  <h3 className="font-serif text-2xl font-bold text-[#191411] mt-1">Diner Portal</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#6E6157] leading-relaxed">
                  Browse curated menus, test custom delivery durations, place food orders, and track courier dispatch in real time.
                </p>
                <ul className="text-xs space-y-2 text-[#4A3C34] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Live Order Tracking & ETA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Punctual Arrival Forecasts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Re-Order Favorites with One Click
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/login"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2 block"
                >
                  <span>Diner Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center mt-3">
                  <Link to="/register" className="text-xs font-bold text-orange-600 hover:underline">
                    New diner? Create account
                  </Link>
                </div>
              </div>
            </div>

            {/* PORTAL 2: RESTAURANT PARTNER */}
            <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ChefHat className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">For Kitchens</span>
                  <h3 className="font-serif text-2xl font-bold text-[#191411] mt-1">Restaurant Partner</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#6E6157] leading-relaxed">
                  Accept orders, update preparation times, toggle menu availability, and manage prep queues so food never sits idle.
                </p>
                <ul className="text-xs space-y-2 text-[#4A3C34] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Live Kitchen Order Queue
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic Prep-Time Adjuster
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dish Catalog & Availability
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/restaurant/login"
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2 block"
                >
                  <span>Restaurant Partner Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center mt-3">
                  <Link to="/restaurant/register" className="text-xs font-bold text-amber-700 hover:underline">
                    Want to list your kitchen? Become a Partner →
                  </Link>
                </div>
              </div>
            </div>


            {/* PORTAL 3: FLEET & PLATFORM ADMIN */}
            <div className="bg-[#191411] text-white rounded-3xl p-8 border border-stone-800 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-800 text-orange-400 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">For Fleet</span>
                  <h3 className="font-serif text-2xl font-bold text-white mt-1">Fleet Operations</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  Inspect real-time fleet analytics, track ML model accuracy and feature importance, and manage platform operations.
                </p>
                <ul className="text-xs space-y-2 text-stone-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" /> Operational & Fleet Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" /> Prediction Model Diagnostics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" /> Complete System Administration
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to="/admin/login"
                  className="w-full py-3.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl text-center border border-stone-700 transition-all flex items-center justify-center gap-2 block"
                >
                  <span>Admin Gateway</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-stone-500 mt-3">Restricted Authorization</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. FOOTER WITH DESI BRANDING & MODEL BENCHMARKS                */}
      {/* ============================================================== */}
      <footer className="bg-[#191411] text-white pt-16 pb-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-stone-800">
            
            <div className="md:col-span-5 space-y-4">
              <Logo size="md" theme="dark" tagline="Instant Food • Punctual Delivery" to="/" />
              <p className="text-stone-400 text-xs sm:text-sm max-w-sm leading-relaxed">
                Celebrating authentic Indian rasois with synchronous kitchen dispatch, transparent arrival times, and piping hot food delivery.
              </p>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>FastAPI • React 19 • Scikit-Learn • Supabase PostgreSQL</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-orange-400">Navigation</h4>
              <ul className="text-sm space-y-2 text-stone-400">
                <li><a href="#story" className="hover:text-white transition-colors">Our Promise</a></li>
                <li><a href="#estimator" className="hover:text-white transition-colors">Arrival Timer</a></li>
                <li><a href="#eateries" className="hover:text-white transition-colors">Local Rasois</a></li>
                <li><a href="#portals" className="hover:text-white transition-colors">All Gateways</a></li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-orange-400">All Logins</h4>
              <ul className="text-sm space-y-2 text-stone-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Diner Login</Link></li>
                <li><Link to="/restaurant/login" className="hover:text-white transition-colors">Restaurant Login</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Fleet Admin</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-orange-400">Model Telemetry</h4>
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 text-xs text-stone-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Linear R² Score:</span>
                  <span className="text-white font-bold">0.824</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean Absolute Error:</span>
                  <span className="text-emerald-400 font-bold">8.12 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Evaluation RMSE:</span>
                  <span className="text-white font-bold">10.47 min</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
            <p>© {new Date().getFullYear()} justwoww Technologies. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Crafted with authentic food love and intelligent routing.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
