import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Landing = () => {
  const { user, isAdmin, isRestaurant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl text-center space-y-8"
      >
        <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Food Delivery Time <span className="text-blue-600">Predictor</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Leverage Machine Learning to accurately predict delivery times based on weather, traffic, and more.
        </p>

        <div className="pt-8 w-full max-w-4xl mx-auto">
          {!user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* USER Section */}
              <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition text-left">
                <div className="mb-6 flex-grow">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Customer</span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-1 mb-2">User Portal</h2>
                  <p className="text-slate-600 text-sm">Order food, predict delivery times with ML, and track your active orders.</p>
                </div>
                <Link to="/login" className="w-full text-center px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                  Continue as User
                </Link>
              </div>

              {/* RESTAURANT Section */}
              <div className="bg-white p-7 rounded-2xl shadow-sm border border-orange-200 flex flex-col h-full hover:shadow-md transition text-left">
                <div className="mb-6 flex-grow">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Partners</span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-1 mb-2">Restaurant Portal</h2>
                  <p className="text-slate-600 text-sm">Approve/manage customer orders, and view monthly OLAP sales analytics.</p>
                </div>
                <Link to="/restaurant/login" className="w-full text-center px-5 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition">
                  Restaurant Login
                </Link>
              </div>

              {/* ADMIN Section */}
              <div className="bg-slate-900 p-7 rounded-2xl shadow-sm border border-slate-800 flex flex-col h-full hover:shadow-md transition text-left">
                <div className="mb-6 flex-grow">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Management</span>
                  <h2 className="text-2xl font-bold text-white mt-1 mb-2">Admin Panel</h2>
                  <p className="text-slate-300 text-sm">Manage users, restaurants, orders, ML predictions, and system health.</p>
                </div>
                <Link to="/admin/login" className="w-full text-center px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                  Admin Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isRestaurant ? (
                <Link to="/restaurant/dashboard" className="px-8 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Restaurant Dashboard
                </Link>
              ) : (
                <Link to="/user/dashboard" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  {isAdmin ? 'User Dashboard' : 'Go to Dashboard'}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Admin Panel
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default Landing;
