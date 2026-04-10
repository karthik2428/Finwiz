import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrivateRoute({ role }) {
  const { user } = useAuth();

  // ⛔ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 Role-based protection (only if role prop is provided)
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Access granted
  return <Outlet />;
}