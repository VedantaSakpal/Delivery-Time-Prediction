import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ChefHat, Store, Mail, Lock, Phone, User, MapPin, Clock,
  ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Award, UtensilsCrossed, Image as ImageIcon
} from 'lucide-react';

const CUISINE_OPTIONS = [
  'North Indian & Mughlai',
  'Hyderabadi Biryani & Kebabs',
  'South Indian Traditional',
  'Royal Rajasthani & Gujarati Thali',
  'Street Food & Chaats',
  'Indo-Chinese & Pan-Asian',
  'Coastal & Bengali Seafood',
  'Bakery, Mithai & Desserts',
  'Pure Vegetarian & Sattvic',
  'Multi-Cuisine Contemporary'
];

const SAMPLE_IMAGES = [
  {
    label: 'Biryani & Clay Pot',
    url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Tandoor & Grills',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Royal Thali & Curries',
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'South Indian Dosa & Chutney',
    url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80'
  }
];

export default function RestaurantRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    restaurant_name: '',
    cuisine_type: CUISINE_OPTIONS[0],
    address: '',
    description: '',
    preparation_time_min: 20,
    fssai_license: '',
    image_url: SAMPLE_IMAGES[0].url
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.fssai_license.trim()) {
      setError('Government FSSAI Food License number is required for merchant compliance.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        owner_name: formData.owner_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        restaurant_name: formData.restaurant_name.trim(),
        cuisine_type: formData.cuisine_type,
        address: formData.address.trim(),
        description: formData.description.trim(),
        preparation_time_min: parseInt(formData.preparation_time_min) || 20,
        fssai_license: formData.fssai_license.trim(),
        image_url: formData.image_url.trim()
      };

      const res = await api.post('/restaurants/apply', payload);
      if (res.data?.success) {
        setSubmittedApp(res.data.application || {
          restaurant_name: formData.restaurant_name,
          fssai_license: formData.fssai_license,
          id: 'REQ-' + Math.random().toString(36).substring(2, 9).toUpperCase()
        });
      } else {
        setError(res.data?.message || 'Failed to submit application.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong while submitting.');
    } finally {
      setLoading(false);
    }
  };

  // If already submitted in this session, show the prominent confirmation card
  if (submittedApp) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#191411] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white">
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border border-amber-200 shadow-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Application Under Review
            </span>
            <h1 className="font-display text-3xl font-black text-[#191411]">
              Welcome to the justwoww Family!
            </h1>
            <p className="text-sm text-[#6E6157] max-w-md mx-auto">
              Your partnership application for <span className="font-bold text-[#191411]">{submittedApp.restaurant_name}</span> has been received and queued for administrative approval.
            </p>
          </div>

          {/* Reference Info Card */}
          <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#ECE4D8] text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">Application ID</span>
              <span className="font-mono font-bold text-stone-800">{submittedApp.id}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">FSSAI License</span>
              <span className="font-mono font-bold text-stone-800">{submittedApp.fssai_license}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">Cuisine Specialization</span>
              <span className="font-bold text-stone-800">{submittedApp.cuisine_type || formData.cuisine_type}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block uppercase tracking-wider text-[10px]">Expected Turnaround</span>
              <span className="font-bold text-emerald-700">24 – 48 Hours</span>
            </div>
          </div>

          {/* Next Steps Timeline */}
          <div className="text-left space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">What Happens Next?</h3>
            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0 text-[10px]">1</div>
                <div><strong className="text-stone-900">Compliance & FSSAI Verification:</strong> Our regulatory team verifies your food license credentials and physical location.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0 text-[10px]">2</div>
                <div><strong className="text-stone-900">Admin Approval & Menu Setup:</strong> Once approved, your account is activated and starter menu items are automatically seeded into your kitchen console.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0 text-[10px]">3</div>
                <div><strong className="text-stone-900">Live Delivery Grid:</strong> Diners can start placing orders and tracking deliveries with AI-estimated prep times.</div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#ECE4D8] flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/restaurant/login"
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
            >
              Go to Kitchen Partner Login
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all text-center"
            >
              Back to justwoww Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#191411] py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white">
      
      {/* Top Back Navigation */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link
          to="/restaurant/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6E6157] hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Kitchen Partner Login
        </Link>
        <span className="text-xs font-semibold text-stone-500">
          Already a partner?{' '}
          <Link to="/restaurant/login" className="font-bold text-amber-700 hover:underline">
            Sign In
          </Link>
        </span>
      </div>

      <div className="max-w-4xl mx-auto w-full bg-white rounded-3xl border border-amber-200 shadow-2xl overflow-hidden">
        
        {/* Hero Header Strip */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Partner with justwoww
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white">
              Grow Your Kitchen with India’s Smartest Food Delivery Network
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Join elite cloud kitchens, authentic heritage eateries, and master chefs. Submit your kitchen application below for instant administrative review and verification.
            </p>
          </div>
          <ChefHat className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10 rotate-12 pointer-events-none" />
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Section 1: Kitchen Owner & Account Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECE4D8]">
              <User className="w-4 h-4 text-amber-600" />
              <h2 className="font-display font-black text-base text-[#191411]">1. Owner & Login Credentials</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Proprietor / Chef Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    placeholder="e.g. Sanjeev Khurana"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Kitchen Official Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="partner@yourrestaurant.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Contact / WhatsApp Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">FSSAI Food License Number *</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="fssai_license"
                    value={formData.fssai_license}
                    onChange={handleChange}
                    placeholder="14-digit Registration e.g. 11521018000452"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-type password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Restaurant & Culinary Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECE4D8]">
              <Store className="w-4 h-4 text-amber-600" />
              <h2 className="font-display font-black text-base text-[#191411]">2. Kitchen Identity & Menu Specialization</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Restaurant / Brand Name *</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleChange}
                    placeholder="e.g. Peshawari Dastarkhwan"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Primary Cuisine Category *</label>
                <div className="relative">
                  <UtensilsCrossed className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    name="cuisine_type"
                    value={formData.cuisine_type}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    {CUISINE_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#191411]">Physical Kitchen Address *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#938376] absolute left-3.5 top-3" />
                  <textarea
                    required
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Unit / Shop No, Street Name, Commercial Hub, City, Pincode"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Average Prep Time (Minutes) *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={5}
                    max={60}
                    required
                    name="preparation_time_min"
                    value={formData.preparation_time_min}
                    onChange={handleChange}
                    placeholder="20"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400">Used by AI Delivery Engine for dispatch timing</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191411]">Cover Image URL</label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-stone-400">Pick from quick presets below or paste custom image link</span>
              </div>

              {/* Sample Preset Thumbnails */}
              <div className="sm:col-span-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Or Pick A High-Res Photo Preset:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormData(prev => ({ ...prev, image_url: img.url }))}
                      className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all ${
                        formData.image_url === img.url ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-sm' : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white leading-tight">{img.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#191411]">About Your Kitchen & Signature Dishes *</label>
                <textarea
                  required
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell our diners about your kitchen's history, culinary philosophy, secret spices, and most celebrated gravies or tandoori specialties..."
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#ECE4D8] rounded-xl text-xs font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Compliance & Submit Button */}
          <div className="pt-4 border-t border-[#ECE4D8] space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                By submitting this application, you declare that all regulatory licenses (including FSSAI) are valid and that your kitchen adheres to standard municipal food safety and hygiene guidelines.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-display font-black text-sm rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Kitchen Application...</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  <span>Submit Partner Application for Admin Review</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
