import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  TrendingUp,
  Shield,
  Users,
  Settings,
  FileText,
  Database,
  Cpu,
  Activity,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActiveRoute = (href) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  // ================= USER NAVIGATION =================
  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Budget', href: '/budget', icon: PiggyBank },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Subscriptions', href: '/subscriptions', icon: TrendingUp },
    { name: 'Premium', href: '/premium', icon: TrendingUp, premium: true },
  ];

  // ================= ADMIN NAVIGATION =================
  const adminNavigation = [
    { name: 'Overview', href: '/admin', icon: Shield },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Payments', href: '/admin/payments', icon: Receipt },
    { name: 'News', href: '/admin/news', icon: Activity },
    { name: 'Funds', href: '/admin/funds', icon: Database },
    { name: 'System', href: '/admin/system', icon: Cpu },
    { name: 'Logs', href: '/admin/logs', icon: FileText },
    { name: 'Config', href: '/admin/config', icon: Settings },
  ];

  const navigation =
    user.role === 'admin' ? adminNavigation : userNavigation;

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex flex-col w-72 bg-[#0f172a] text-slate-200 border-r border-white/5 min-h-screen">

      {/* ================= LOGO ================= */}

<Link
  to="/"
  className="px-6 py-6 border-b border-white/5 block hover:bg-white/5 transition"
>
  <div className="flex items-center gap-2">
    <div
      className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold ${
        isAdmin
          ? 'bg-gradient-to-br from-red-500 to-rose-600'
          : 'bg-gradient-to-br from-indigo-500 to-violet-600'
      }`}
    >
      F
    </div>

    <span className="text-lg font-semibold tracking-tight text-white">
      {isAdmin ? 'FinWiz Admin' : 'FinWiz'}
    </span>
  </div>
</Link>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? isAdmin
                    ? "bg-red-600 text-white"
                    : "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {/* Active left indicator */}
              {isActive && (
                <span
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                    isAdmin ? 'bg-red-400' : 'bg-indigo-400'
                  }`}
                />
              )}

              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-white"
                    : item.premium
                    ? "text-amber-400"
                    : "text-slate-500"
                )}
              />

              <span className="flex-1">{item.name}</span>

              {/* Premium Badge */}
              {item.premium && !isAdmin && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold tracking-wide">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ================= USER SECTION ================= */}
      <div className="border-t border-white/5 p-5">
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
            isAdmin
              ? 'bg-red-500/20 text-red-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-white leading-tight">
              {user?.name}
            </p>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mt-1 transition"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
