import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Store, MapPin, Clock, Star, Search, Filter, Sparkles, ArrowRight } from 'lucide-react';
import { MOCK_RESTAURANTS } from '../../utils/mockRestaurants';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const CUISINES = ['All', 'Biryani', 'North Indian', 'South Indian', 'Chaat', 'Mughlai', 'Mithai'];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/restaurants/`);
        if (res.data?.restaurants && res.data.restaurants.length > 0) {
          const enriched = res.data.restaurants.map(r => {
            const text = `${r.name} ${r.description || ''}`.toLowerCase();
            let cuisine = r.cuisine;
            if (!cuisine) {
              if (text.includes('biryani') || text.includes('dastarkhwan')) cuisine = 'Biryani';
              else if (text.includes('dosa') || text.includes('idli') || text.includes('dakshin')) cuisine = 'South Indian';
              else if (text.includes('chaat') || text.includes('pav bhaji') || text.includes('chowpatty')) cuisine = 'Chaat';
              else if (text.includes('kebab') || text.includes('tandoor') || text.includes('dilli')) cuisine = 'Mughlai';
              else if (text.includes('mithai') || text.includes('sweet') || text.includes('jalebi') || text.includes('bikaneri')) cuisine = 'Mithai';
              else cuisine = 'North Indian';
            }
            return {
              ...r,
              cuisine,
              rating: r.rating || (4.6 + (r.name.length % 4) * 0.1).toFixed(1),
              price_range: r.price_range || '₹₹'
            };
          });
          setRestaurants(enriched);
        } else {
          setRestaurants(MOCK_RESTAURANTS);
        }
      } catch (err) {
        console.warn('Using curated restaurant catalog fallback:', err);
        setRestaurants(MOCK_RESTAURANTS);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCuisine = selectedCuisine === 'All' || r.cuisine?.toLowerCase() === selectedCuisine.toLowerCase();
      return matchesSearch && matchesCuisine;
    });
  }, [restaurants, searchQuery, selectedCuisine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Indian Rasois & Tandoors
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Garma-garam food from the best rasois in town.
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Every dish is cooked fresh and synchronized with rider approach. Enjoy authentic flavors without cold delays.
          </p>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#938376] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, cuisines, or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-[#ECE4D8] text-sm font-medium text-[#191411] placeholder-[#938376] focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CUISINES.map((c) => {
              const active = selectedCuisine === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white hover:bg-stone-50 text-[#6E6157] border border-[#ECE4D8]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Restaurant Cards Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#ECE4D8] p-8 space-y-3">
          <Store className="w-12 h-12 text-[#938376] mx-auto" />
          <h3 className="font-display font-bold text-lg text-[#191411]">No kitchens found</h3>
          <p className="text-xs text-[#6E6157]">Try changing your search term or selecting "All" cuisines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => {
            const prep = restaurant.preparation_time_min || 15;
            const dist = restaurant.distance_km || 3.0;
            const eta = Math.round(prep + dist * 2);

            return (
              <Link
                to={`/user/restaurants/${restaurant.id}`}
                key={restaurant.id}
                className="block group"
              >
                <div className="bg-white rounded-3xl shadow-sm border border-[#ECE4D8] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  
                  {/* Image container */}
                  <div className="h-48 bg-stone-100 relative overflow-hidden">
                    {restaurant.image_url ? (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Store className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Live ETA Chip */}
                    <div className="absolute bottom-3 left-3 bg-[#191411]/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>{eta} min ETA</span>
                    </div>

                    {/* Rating Chip */}
                    <div className="absolute top-3 right-3 bg-white/95 px-2 py-0.5 rounded-lg text-xs font-extrabold text-[#191411] flex items-center gap-1 shadow">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{restaurant.rating || '4.9'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-[#191411] group-hover:text-orange-600 transition-colors">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-[#6E6157] line-clamp-2 mt-1 leading-relaxed">
                        {restaurant.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#ECE4D8] flex items-center justify-between text-xs text-[#6E6157]">
                      <span className="flex items-center gap-1 font-medium truncate max-w-[160px]">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {restaurant.address || 'Downtown'}
                      </span>
                      <span className="font-bold text-orange-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
