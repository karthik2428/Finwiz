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
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60s
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative mr-4" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-primary-600 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                        <button onClick={fetchNotifications} className="text-xs text-primary-600 hover:text-primary-800">Refresh</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => !notification.read && markAsRead(notification._id)}
                                >
                                    <p className="text-sm text-slate-800 font-medium">{notification.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                                    <p className="text-xs text-slate-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-slate-500">
                                No notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
