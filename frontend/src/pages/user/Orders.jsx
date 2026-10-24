import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import { Clock, MapPin, Package, CheckCircle, Truck, AlertTriangle, Store } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const res = await axios.get(`${API_URL}/api/orders/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-display font-black text-3xl text-[#191411]">My Zaika Orders</h1>
        <p className="text-xs text-[#6E6157]">Track your active and past deliveries with AI arrival intervals</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#ECE4D8] space-y-3">
          <p className="text-sm text-[#6E6157]">You haven't placed any orders yet.</p>
          <a href="/user/restaurants" className="inline-block px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700">
            Browse Indian Kitchens
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const pred = order.predictions?.[0]; // Assuming one prediction per order
            return (
              <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-[#ECE4D8] overflow-hidden">
                <div className="p-5 border-b border-[#ECE4D8] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FAF7F2]">
                  <div className="flex items-center gap-4">
                    {order.restaurants.image_url ? (
                      <img src={order.restaurants.image_url} alt="restaurant" className="w-12 h-12 rounded-2xl object-cover border border-[#ECE4D8]" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center">
                        <Store className="w-6 h-6 text-stone-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-black text-lg text-[#191411]">{order.restaurants.name}</h3>
                      <p className="text-xs text-[#938376]">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-700 border border-orange-200">
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="font-display font-black text-lg text-[#191411] mt-1">₹{order.total_amount}</p>
                  </div>
                </div>

                <div className="p-5 flex flex-col lg:flex-row gap-6">
                  {/* Order Details */}
                  <div className="flex-1 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#938376]">Order Items</h4>
                    <ul className="text-xs space-y-2">
                      {order.order_items.map(item => (
                        <li key={item.id} className="text-[#4A3C34] flex justify-between font-medium">
                          <span>{item.quantity}× {item.menu_items.name}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#6E6157] flex items-center gap-1.5 pt-2 border-t border-[#ECE4D8]">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>{order.delivery_address}</span>
                    </p>
                  </div>
                  
                  {/* ML Prediction Panel */}
                  {pred && (
                    <div className="flex-1 bg-[#FAF7F2] p-5 rounded-2xl border border-[#ECE4D8] space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <h4 className="font-display font-bold text-xs text-[#191411]">Zaika ETA Forecast</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl shadow-xs border border-[#ECE4D8]">
                          <p className="text-[11px] text-[#938376] font-bold uppercase mb-0.5">Expected In</p>
                          <p className="text-xl font-display font-black text-orange-600">{pred.predicted_delivery_time_min} <span className="text-xs font-normal text-[#6E6157]">mins</span></p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-xs border border-[#ECE4D8]">
                          <p className="text-[11px] text-[#938376] font-bold uppercase mb-0.5">Range</p>
                          <p className="text-base font-bold text-[#191411]">{pred.prediction_range_lower} – {pred.prediction_range_upper} <span className="text-xs font-normal text-[#6E6157]">mins</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                         <span className="font-bold uppercase tracking-wider text-[#938376] text-[10px]">Reliability:</span>
                         {pred.reliability === 'High' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">High Confidence</span>}
                         {pred.reliability === 'Medium' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Medium</span>}
                         {pred.reliability === 'Low' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low</span>}
                      </div>
                      
                      {pred.explanation && pred.explanation.length > 0 && (
                        <div className="pt-2 border-t border-[#ECE4D8]">
                          <p className="text-[11px] font-bold text-[#938376] mb-1.5 uppercase tracking-wider">Top Transit Factors:</p>
                          <div className="space-y-1">
                            {pred.explanation.slice(0,3).map((exp, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-[#6E6157]">{exp.feature}</span>
                                <span className={`font-mono font-bold ${exp.impact > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                                  {exp.impact > 0 ? "+" : ""}{exp.impact.toFixed(1)}m
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
