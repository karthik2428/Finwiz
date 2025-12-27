import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import {
    LayoutDashboard,
    Receipt,
    PiggyBank,
    Target,
    TrendingUp,
    Users,
    LogOut,
    Settings,
    Shield
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', href: '/transactions', icon: Receipt },
        { name: 'Budget', href: '/budget', icon: PiggyBank },
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Subscriptions', href: '/subscriptions', icon: TrendingUp },
    ];

    navigation.push({ name: 'Premium', href: '/premium', icon: TrendingUp, premium: true });

    if (user?.role === 'admin') {
        navigation.push({ name: 'Admin Console', href: '/admin', icon: Shield });
    }

    return (
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-screen text-white">
            <Link to={'/'}>
            <div className="flex items-center justify-center h-16 border-b border-slate-800">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
                    FinWiz
                </span>
            </div>
            </Link>

            <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
                <nav className="mt-5 flex-1 px-2 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-primary-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        'mr-3 flex-shrink-0 h-6 w-6 transition-colors',
                                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                                        item.premium && 'text-amber-400'
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-slate-800 p-4">
                <div className="flex-shrink-0 w-full group block">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <button
                                onClick={logout}
                                className="text-xs font-medium text-slate-400 group-hover:text-slate-300 flex items-center mt-1"
                            >
                                <LogOut className="mr-1 h-3 w-3" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
