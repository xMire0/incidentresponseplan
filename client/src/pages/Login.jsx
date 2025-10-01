import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom"; // ⬅️ add this
import "./login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();              // ⬅️ add this
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { user } = await login(email, password);   // get role from AuthContext
      if (user.role === "admin") navigate("/admin", { replace: true });
      else navigate("/employee", { replace: true });   // developer/employee => /employee
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  };

  return (
    <div className="login-screen">
      <main className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title">Log in</h1> {/* optional: English */}
          <div className="login-accent" />
        </header>

        <form className="login-form" onSubmit={onSubmit}>
          {/* Email */}
          <label className="login-label" htmlFor="email">Email</label>
          <div className="input-wrap">
            <input
              id="email"
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="input-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          {/* Password */}
          <label className="login-label" htmlFor="password">Password</label>
          <div className="input-wrap">
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-icon btn-icon"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 12s3.8-7 10-7c2.2 0 4 .7 5.7 1.7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M22 12s-3.8 7-10 7c-2.2 0-4-.7-5.7-1.7" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>

          {err && <div className="error">{err}</div>}

          <button type="submit" className="btn-primary">Login</button>
        </form>

        <div className="login-footer">
          <hr className="divider" />
          <p className="note">
            Admin → Admin Dashboard. Developers/Employees → Training page.
          </p>
          <div className="mini-divider">
            <span className="line" />
            <span className="mini-text">Secure Login</span>
            <span className="line" />
          </div>
        </div>
      </main>
    </div>
  );
}
