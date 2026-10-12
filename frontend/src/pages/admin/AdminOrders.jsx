import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, ShoppingBag, MapPin, Clock, CreditCard } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-teal-100 text-teal-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/admin/orders');
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const statuses = ['all', 'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'rejected'];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">All Orders</h2>
        <span className="text-sm text-slate-500">{filtered.length} order(s)</span>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-800">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Customer</p>
                  <p className="text-slate-700 font-medium">{order.profiles?.full_name || '—'}</p>
                  <p className="text-slate-500 text-xs">{order.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Restaurant</p>
                  <p className="text-slate-700 font-medium">{order.restaurants?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Details</p>
                  <p className="text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.delivery_address}</p>
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5"><CreditCard className="w-3 h-3" /> {order.payment_method}</p>
                </div>
              </div>
              {order.order_items && order.order_items.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {order.order_items.map((item, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">
                        {item.quantity}x {item.menu_items?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
