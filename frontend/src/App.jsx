import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import RestaurantLayout from './layouts/RestaurantLayout';

import Landing from './pages/public/Landing';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import RestaurantLogin from './pages/auth/RestaurantLogin';
import RestaurantRegister from './pages/auth/RestaurantRegister';


// User Pages
import Dashboard from './pages/user/Dashboard';
import Predict from './pages/user/Predict';
import History from './pages/user/History';
import Profile from './pages/user/Profile';
import Restaurants from './pages/user/Restaurants';
import RestaurantDetail from './pages/user/RestaurantDetail';
import Checkout from './pages/user/Checkout';
import Orders from './pages/user/Orders';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPredictions from './pages/admin/AdminPredictions';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminOrders from './pages/admin/AdminOrders';
import Analytics from './pages/admin/Analytics';
import ModelInfo from './pages/admin/ModelInfo';
import AdminReports from './pages/admin/AdminReports';
import AdminWarehouse from './pages/admin/AdminWarehouse';

// Restaurant Pages
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';

const ProtectedRoute = ({ children, requireAdmin, requireRestaurant }) => {
  const { user, isAdmin, isRestaurant, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/user/dashboard" replace />;
  if (requireRestaurant && !isRestaurant) return <Navigate to="/user/dashboard" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/restaurant/login" element={<RestaurantLogin />} />
          <Route path="/restaurant/register" element={<RestaurantRegister />} />
          <Route path="/restaurant/signup" element={<RestaurantRegister />} />


          {/* User Routes */}
          <Route path="/user" element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="predict" element={<Predict />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="restaurants/:id" element={<RestaurantDetail />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          {/* Restaurant Routes */}
          <Route path="/restaurant" element={<ProtectedRoute requireRestaurant={true}><RestaurantLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<RestaurantDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="predictions" element={<AdminPredictions />} />
            <Route path="warehouse" element={<AdminWarehouse />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="model" element={<ModelInfo />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
