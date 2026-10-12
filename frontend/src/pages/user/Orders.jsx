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

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const pred = order.predictions?.[0]; // Assuming one prediction per order
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                  <div className="flex items-center gap-4">
                    {order.restaurants.image_url ? (
                      <img src={order.restaurants.image_url} alt="restaurant" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Store className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{order.restaurants.name}</h3>
                      <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="font-bold text-slate-800 mt-1">${order.total_amount}</p>
                  </div>
                </div>

                <div className="p-5 flex flex-col lg:flex-row gap-6">
                  {/* Order Details */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-700 mb-2">Order Summary</h4>
                    <ul className="text-sm space-y-1 mb-4">
                      {order.order_items.map(item => (
                        <li key={item.id} className="text-slate-600 flex justify-between">
                          <span>{item.quantity}x {item.menu_items.name}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> {order.delivery_address}</p>
                  </div>
                  
                  {/* ML Prediction Panel */}
                  {pred && (
                    <div className="flex-1 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-blue-900">AI Delivery Estimate</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Expected In</p>
                          <p className="text-xl font-extrabold text-slate-800">{pred.predicted_delivery_time_min} <span className="text-sm font-medium">mins</span></p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Range</p>
                          <p className="text-lg font-bold text-slate-700">{pred.prediction_range_lower} - {pred.prediction_range_upper} <span className="text-sm font-medium">mins</span></p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Reliability:</span>
                           {pred.reliability === 'High' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">High</span>}
                           {pred.reliability === 'Medium' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Medium</span>}
                           {pred.reliability === 'Low' && <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low</span>}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Why this prediction?</p>
                        <div className="space-y-1">
                          {pred.explanation && pred.explanation.slice(0,3).map((exp, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-600">{exp.feature}</span>
                              <span className={exp.impact > 0 ? "text-orange-600" : "text-green-600"}>
                                {exp.impact > 0 ? "+" : ""}{exp.impact.toFixed(1)}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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
