import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Simpel auth-service. Skift til rigtig API-kald senere (POST /auth/login).
async function fakeLogin(email, password) {
  // TODO: erstat med: await api.post("/auth/login", {email, password})
  // og returner token/rolle fra serveren.
  await new Promise(r => setTimeout(r, 400));
  if (!email || !password) throw new Error("Ugyldige credentials");

  // Demo-roller ud fra email
  const role = email.endsWith("@admin.com") ? "admin" : "developer";
  const token = "demo-token";
  return { user: { email, role }, token };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydratér fra localStorage
  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed.user ?? null);
        setToken(parsed.token ?? null);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fakeLogin(email, password);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("auth", JSON.stringify(res));
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
  };

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
