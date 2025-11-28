import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token and load user on mount
  useEffect(() => {
    const verifyAndLoadUser = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Verify token by calling /api/auth/me
        const { data } = await api.get("/api/auth/me");
        setUser(data);
        setToken(storedToken);
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoadUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    
    const { token: newToken, user: userData } = data;
    
    // Store token
    localStorage.setItem("auth_token", newToken);
    
    // Also store in old format for backward compatibility (can be removed later)
    localStorage.setItem("auth", JSON.stringify({ user: userData, token: newToken }));
    
    setUser(userData);
    setToken(newToken);
    
    return { user: userData, token: newToken };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth");
  };

  const verifyToken = async () => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return false;
    }

    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data);
      setToken(storedToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value = useMemo(() => ({ user, token, loading, login, logout, verifyToken }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
