import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, Store, MapPin, Clock, User } from 'lucide-react';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await api.get('/admin/restaurants');
        setRestaurants(res.data.restaurants);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">All Restaurants</h2>
        <span className="text-sm text-slate-500">{restaurants.length} restaurant(s)</span>
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No restaurants registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-36 bg-slate-100 relative">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Store className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-800 text-lg">{r.name}</h3>
                {r.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">{r.description}</p>
                )}
                <div className="space-y-1.5 text-sm text-slate-500">
                  {r.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {r.address}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    Prep Time: {r.preparation_time_min} mins
                  </p>
                  {r.profiles && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-4 h-4 flex-shrink-0" />
                      Owner: {r.profiles.full_name || r.profiles.email}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                  <span>ID: {r.id.slice(0, 8)}...</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
