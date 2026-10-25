import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../../utils/supabase';
import OperationsReportView from '../../components/OperationsReportView';
import { Loader2 } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

export default function AdminReports() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const res = await axios.get(`${API_URL}/api/restaurants/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurants(res.data.restaurants || []);
      } catch (err) {
        console.error('Failed to load restaurants list for admin report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-orange-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <OperationsReportView userRole="admin" restaurantsList={restaurants} />
    </div>
  );
}
