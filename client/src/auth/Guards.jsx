import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Must be logged in
export function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Must be one of these roles
export function RoleRoute({ allow = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}