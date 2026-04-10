import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === id ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>

            {/* ================= Bell Button ================= */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* ================= Dropdown ================= */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-white">
                            Notifications
                        </h3>

                        <button
                            onClick={fetchNotifications}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                        >
                            Refresh
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">

                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    onClick={() =>
                                        !notification.read &&
                                        markAsRead(notification._id)
                                    }
                                    className={`px-5 py-4 cursor-pointer transition border-b border-slate-800 last:border-0
                                        ${notification.read
                                            ? 'hover:bg-slate-800'
                                            : 'bg-indigo-900/20 hover:bg-indigo-900/30'
                                        }`}
                                >
                                    <p className="text-sm font-medium text-white">
                                        {notification.title}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>

                                    <p className="text-[11px] text-slate-500 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-10 text-center text-sm text-slate-500">
                                No notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}