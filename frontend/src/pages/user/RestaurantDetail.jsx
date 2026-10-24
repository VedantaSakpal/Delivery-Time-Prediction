import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Store, Plus, Minus, ShoppingBag, ArrowLeft, Clock, MapPin, Star, Sparkles } from 'lucide-react';
import { MOCK_RESTAURANTS } from '../../utils/mockRestaurants';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/restaurants/${id}`);
        if (res.data && res.data.name) {
          setData(res.data);
        } else {
          fallbackMock();
        }
      } catch (err) {
        fallbackMock();
      } finally {
        setLoading(false);
      }
    };

    const fallbackMock = () => {
      const found = MOCK_RESTAURANTS.find(r => r.id === id || r.name.toLowerCase().includes(id.toLowerCase())) || MOCK_RESTAURANTS[0];
      setData(found);
    };

    fetchDetail();
  }, [id]);

  const updateCart = (item, delta) => {
    setCart(prev => {
      const current = prev[item.id]?.quantity || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const newCart = { ...prev };
        delete newCart[item.id];
        return newCart;
      }
      return { ...prev, [item.id]: { item, quantity: next } };
    });
  };

  const handleCheckout = () => {
    const items = Object.values(cart).map(c => ({
      menu_item_id: c.item.id,
      quantity: c.quantity,
      price: c.item.price,
      name: c.item.name
    }));
    navigate('/user/checkout', { state: { restaurant_id: id, items, restaurant_name: data?.name } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#191411]">Restaurant not found</h2>
        <Link to="/user/restaurants" className="text-orange-600 font-bold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to all restaurants
        </Link>
      </div>
    );
  }

  const cartTotal = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const cartCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* Back button */}
      <div>
        <Link
          to="/user/restaurants"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6E6157] hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Kitchens
        </Link>
      </div>

      {/* Restaurant Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-[#ECE4D8] shadow-sm">
        <div className="h-64 sm:h-80 w-full relative">
          <img
            src={data.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"}
            alt={data.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-orange-600 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow">
                Artisan Kitchen
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {data.rating || '4.9'}
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl">{data.name}</h1>
            <p className="text-white/80 text-sm max-w-2xl leading-relaxed">{data.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-white/90 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-300" />
                {data.address || 'Central District'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Prep Time: ~{data.preparation_time_min || 15} mins
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Menu Items (Left) + Sticky Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Menu Items (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECE4D8] pb-4">
            <h2 className="font-display font-extrabold text-2xl text-[#191411]">Signature Offerings</h2>
            <span className="text-xs text-[#6E6157] font-semibold">{data.menu?.length || 0} dishes available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.menu?.map((item) => {
              const count = cart[item.id]?.quantity || 0;
              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-[#ECE4D8] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {item.image_url && (
                      <div className="h-36 rounded-xl overflow-hidden mb-2 bg-stone-100">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-serif font-bold text-base text-[#191411]">{item.name}</h3>
                    <p className="text-xs text-[#6E6157] line-clamp-2 leading-relaxed">{item.description}</p>
                    <p className="font-serif font-extrabold text-orange-600 text-base">₹{Number(item.price)}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ECE4D8] flex items-center justify-between">
                    {count === 0 ? (
                      <button
                        onClick={() => updateCart(item, 1)}
                        className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Order
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-[#FAF7F2] p-1 rounded-xl border border-[#ECE4D8]">
                        <button
                          onClick={() => updateCart(item, -1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-xs text-[#191411] flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm text-[#191411]">{count}</span>
                        <button
                          onClick={() => updateCart(item, 1)}
                          className="w-8 h-8 rounded-lg bg-orange-600 text-white shadow-xs flex items-center justify-center hover:bg-orange-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Cart Sidebar (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="bg-white rounded-3xl border border-[#ECE4D8] p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECE4D8] pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#191411] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>Your Order</span>
              </h3>
              <span className="text-xs bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-full">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {cartCount === 0 ? (
              <div className="py-8 text-center text-[#938376] space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-[#ECE4D8]" />
                <p className="text-xs font-semibold">Your order is empty</p>
                <p className="text-[11px]">Select items from the menu to calculate arrival time and order.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {Object.values(cart).map((c) => (
                    <div key={c.item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#191411]">{c.item.name}</p>
                        <p className="text-[11px] text-[#6E6157]">{c.quantity} × ₹{Number(c.item.price)}</p>
                      </div>
                      <span className="font-mono font-bold text-[#191411]">
                        ₹{(c.item.price * c.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#ECE4D8] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6E6157]">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#191411]">₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[#6E6157]">
                    <span>Estimated Transit</span>
                    <span className="text-emerald-700 font-bold">~{data.preparation_time_min + 12} mins</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#191411] pt-2 border-t border-[#ECE4D8]">
                    <span>Total</span>
                    <span className="text-orange-600 font-mono font-bold">₹{cartTotal.toFixed(0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
