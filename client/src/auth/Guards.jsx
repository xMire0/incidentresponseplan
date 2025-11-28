import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Must be logged in
export function ProtectedRoute() {
  const { user, loading, verifyToken } = useAuth();
  
  // Wait for auth to load
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading component
  }
  
  // Verify token if we have one but no user
  if (!user && localStorage.getItem("auth_token")) {
    verifyToken();
    return <div>Verifying...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Must be one of these roles (matches backend role names: Admin, Analyst, Developer, Sikkerhedsmanager)
export function RoleRoute({ allow = [] }) {
  const { user, loading, verifyToken } = useAuth();
  
  // Wait for auth to load
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Verify token if we have one but no user
  if (!user && localStorage.getItem("auth_token")) {
    verifyToken();
    return <div>Verifying...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Normalize role comparison (case-insensitive)
  const userRole = user.role || "";
  const normalizedUserRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
  const normalizedAllow = allow.map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase());
  
  if (!normalizedAllow.includes(normalizedUserRole)) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}