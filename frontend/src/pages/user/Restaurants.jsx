import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Store, MapPin, Clock } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/restaurants/`);
        setRestaurants(res.data.restaurants);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  if (loading) return <div className="p-8">Loading restaurants...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Restaurants</h1>
        <p className="text-slate-500 mt-2">Discover great food around you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Link to={`/user/restaurants/${restaurant.id}`} key={restaurant.id} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-slate-200 relative">
                {restaurant.image_url ? (
                  <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Store className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{restaurant.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> {restaurant.address || 'Various locations'}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Prep: {restaurant.preparation_time_min} mins</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
