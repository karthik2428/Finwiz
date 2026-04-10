import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const dashboardPath =
        user?.role === 'admin' ? '/admin' : '/dashboard';

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">

                    {/* ================= LOGO ================= */}
                    <Link
                        to={user ? dashboardPath : '/'}
                        className="flex items-center gap-2 group"
                    >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/30">
                            F
                        </div>

                        <span className="text-lg font-semibold tracking-tight text-white group-hover:text-indigo-400 transition">
                            FinWiz
                        </span>
                    </Link>

                    {/* ================= RIGHT SIDE ================= */}
                    <div className="flex items-center gap-6 text-sm">

                        {user ? (
                            <>
                                <NotificationCenter />

                                <Link
                                    to={dashboardPath}
                                    className="text-slate-300 hover:text-white transition font-medium"
                                >
                                    Dashboard
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-slate-300 hover:text-white transition font-medium"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/signup"
                                    className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}