import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { useState, useEffect } from 'react';
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
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  // Sidebar content component
  const SidebarContent = () => (
    <>
      {/* ================= LOGO ================= */}
      <Link
        to="/"
        className="px-4 md:px-6 py-4 md:py-6 border-b border-white/5 block hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <div
            className={`h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center text-white font-bold ${
              isAdmin
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-indigo-500 to-violet-600'
            }`}
          >
            F
          </div>

          <span className="text-base md:text-lg font-semibold tracking-tight text-white">
            {isAdmin ? 'FinWiz Admin' : 'FinWiz'}
          </span>
        </div>
      </Link>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 px-3 md:px-4 py-4 md:py-6 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navigation.map((item) => {
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200",
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
                  "h-4 w-4 md:h-5 md:w-5 transition-colors shrink-0",
                  isActive
                    ? "text-white"
                    : item.premium
                    ? "text-amber-400"
                    : "text-slate-500"
                )}
              />

              <span className="flex-1 truncate">{item.name}</span>

              {/* Premium Badge */}
              {item.premium && !isAdmin && (
                <span className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold tracking-wide whitespace-nowrap">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ================= USER SECTION ================= */}
      <div className="border-t border-white/5 p-3 md:p-5">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Avatar */}
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-semibold text-xs md:text-base shrink-0 ${
            isAdmin
              ? 'bg-red-500/20 text-red-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium text-white leading-tight truncate">
              {user?.name}
            </p>

            <button
              onClick={logout}
              className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 hover:text-slate-300 mt-1 transition"
            >
              <LogOut className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0f172a] border border-white/10 text-white shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Sidebar (Overlay) */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex flex-col bg-[#0f172a] text-slate-200 border-r border-white/5 min-h-screen transition-all duration-300 z-40",
          "md:w-72 md:relative md:translate-x-0",
          "fixed top-0 left-0 h-full w-72",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop Sidebar (always visible) */}
      {!isMobile && (
        <div className="hidden md:flex md:w-72 md:shrink-0">
          <div className="fixed w-72 h-full">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
