import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Header.css";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">IR</span>
          <span className="brand-text">Incident Response</span>
        </Link>

        <nav className="main-nav">
          <NavLink to="/" end>Hjem</NavLink>
          <NavLink to="/scenarios">Scenarier</NavLink>
          <NavLink to="/train">Træning</NavLink>
          <NavLink to="/reports">Rapporter</NavLink>
          {user ? (
            <button className="btn small" onClick={onLogout} style={{ marginLeft: 8 }}>
              Logout ({user.role})
            </button>
          ) : (
            <NavLink to="/login" style={{ marginLeft: 8 }}>Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
