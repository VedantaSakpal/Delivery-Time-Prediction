import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Plus, Minus, ShoppingCart } from 'lucide-react';
import { supabase } from '../../utils/supabase';

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
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
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
    
    // Pass state to checkout page
    navigate('/user/checkout', { state: { restaurant_id: id, items } });
  };

  if (loading) return <div className="p-8">Loading menu...</div>;
  if (!data) return <div className="p-8">Restaurant not found</div>;

  const cartTotal = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const cartCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 relative">
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">{data.name}</h1>
          <p className="text-slate-500 mt-2">{data.description}</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.menu?.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 h-10 overflow-hidden">{item.description}</p>
                  <p className="font-semibold text-green-600 mt-2">${item.price}</p>
                </div>
                <div className="mt-4 flex items-center gap-3 bg-slate-50 w-fit p-1 rounded-lg">
                  <button onClick={() => updateCart(item, -1)} className="p-1 text-slate-600 hover:bg-slate-200 rounded"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">{cart[item.id]?.quantity || 0}</span>
                  <button onClick={() => updateCart(item, 1)} className="p-1 text-slate-600 hover:bg-slate-200 rounded"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cartCount > 0 && (
        <div className="w-full lg:w-80 lg:sticky lg:top-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5" /> Your Cart</h3>
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {Object.values(cart).map(c => (
              <div key={c.item.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">{c.quantity}x {c.item.name}</span>
                <span className="text-slate-500">${(c.item.price * c.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4 flex justify-between items-center font-bold text-lg mb-6">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button onClick={handleCheckout} className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
