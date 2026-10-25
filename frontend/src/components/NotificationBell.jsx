import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Bell, CheckCheck, Trash2, X, Store, ShoppingBag,
  ChefHat, Truck, CheckCircle2, AlertCircle, Sparkles,
  ExternalLink, Clock
} from 'lucide-react';

// Gentle synthetic two-tone chime via Web Audio API
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone bell chime: E5 (659Hz) -> A5 (880Hz)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch (err) {
    // Audio autoplay restrictions may ignore without user gesture
  }
};

const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
};

export default function NotificationBell({ role = 'user' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [loading, setLoading]             = useState(false);

  const prevUnreadRef = useRef(null);
  const dropdownRef   = useRef(null);
  const navigate      = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const list = res.data.notifications || [];
      const unread = res.data.unread_count || 0;

      // If unread count increased after initial load, play sound chime!
      if (prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
        playChime();
      }
      prevUnreadRef.current = unread;

      setNotifications(list);
      setUnreadCount(unread);
    } catch (err) {
      // Silently ignore background polling errors if session expired
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 6 seconds for live updates
    const interval = setInterval(fetchNotifications, 6000);

    // Click outside handler
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/notifications/${notifId}/read`);
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${notifId}`);
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }

    // Contextual navigation based on notification type and recipient
    if (notif.type === 'new_order') {
      navigate('/restaurant/dashboard');
    } else if (notif.type === 'order_placed' || notif.type === 'status_update') {
      navigate('/user/orders');
    } else if (notif.type === 'partner_application') {
      navigate('/admin/restaurants');
    } else if (notif.type === 'partner_approved') {
      navigate('/restaurant/dashboard');
    }
    setIsOpen(false);
  };

  const getNotifIcon = (type, title) => {
    switch (type) {
      case 'new_order':
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case 'order_placed':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'status_update':
        if (title.includes('Preparing')) {
          return (
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
          );
        } else if (title.includes('Out')) {
          return (
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
          );
        } else if (title.includes('Delivered')) {
          return (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          );
        }
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'partner_application':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
        );
      case 'partner_approved':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'partner_rejected':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      
      {/* Trigger Button with Unread Badge & Pulse Symbol */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500/30'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
        }`}
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-orange-600' : 'text-stone-600'}`} />

        {/* Unread Symbol / Badge */}
        {unreadCount > 0 && (
          <>
            {/* Ping effect ring */}
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600" />
            </span>

            {/* Badge Counter */}
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-md border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#ECE4D8] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#FAF7F2] to-white border-b border-[#ECE4D8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-600" />
              <h3 className="font-display font-black text-sm text-[#191411]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Scroll Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#ECE4D8]/60">
            {notifications.length === 0 ? (
              <div className="py-12 text-center px-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-stone-800">All caught up!</p>
                <p className="text-[11px] text-stone-400">
                  No notifications right now. When orders or status updates occur, they’ll arrive here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.is_read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      isUnread
                        ? 'bg-amber-50/50 hover:bg-amber-50/80'
                        : 'bg-white hover:bg-stone-50/80'
                    }`}
                  >
                    {/* Unread dot symbol indicator */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0 mt-2.5 shadow-xs animate-pulse" />
                    )}

                    {/* Context Icon */}
                    {getNotifIcon(notif.type, notif.title)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${isUnread ? 'font-black text-[#191411]' : 'font-semibold text-stone-700'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#6E6157] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Quick Action Icons (Delete / Dismiss) */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity rounded-lg hover:bg-white cursor-pointer absolute right-3 top-3"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-[#FAF7F2] border-t border-[#ECE4D8] flex items-center justify-between text-[11px]">
              <span className="text-stone-400">
                {notifications.length} total {notifications.length === 1 ? 'alert' : 'alerts'}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-stone-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
