import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar, Key } from 'lucide-react';

export default function Profile() {
  const { profile, user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-700 absolute -top-12 shadow-md">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
            <p className="text-slate-500 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Account Details</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Email Address</p>
              <p className="text-slate-900">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Full Name</p>
              <p className="text-slate-900">{profile?.full_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Member Since</p>
              <p className="text-slate-900">{new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
