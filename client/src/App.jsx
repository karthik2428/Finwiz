import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/layout/PrivateRoute';
import { Toaster } from 'react-hot-toast';
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// User pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Subscriptions from './pages/Subscriptions';
import Premium from './pages/Premium';
import Profile from './pages/Profile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminNews from './pages/admin/AdminNews';
import AdminFunds from './pages/admin/AdminFunds';
import AdminSystem from './pages/admin/AdminSystem';
import AdminLogs from './pages/admin/AdminLogs';
import AdminConfig from './pages/admin/AdminConfig';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Toaster position="top-right" />

        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* User Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Protected */}
          <Route element={<PrivateRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/funds" element={<AdminFunds />} />
            <Route path="/admin/system" element={<AdminSystem />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/config" element={<AdminConfig />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/verify-otp" element={<VerifyOtp />} />
<Route path="/reset-password" element={<ResetPassword />} />
        </Routes>

      </div>
    </AuthProvider>
  );
}

export default App;