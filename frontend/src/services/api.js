import axios from 'axios';
import { supabase } from '../utils/supabase';

// Normalize base URL to backend root (e.g. http://localhost:8000)
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: rawUrl,
});

api.interceptors.request.use(async (config) => {
  // Ensure the route is prefixed with /api if not already present
  if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
    config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;
