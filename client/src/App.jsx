// src/App.jsx
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Employee from "./pages/Employee.jsx";
import Train from "./pages/Train.jsx"; // ← test runner page

export default function App() {
  const location = useLocation();

  // Hide the global header on these routes so the page-specific topbars shine
  const hideHeaderOn = ["/login", "/admin", "/employee"];
  const isTrain = location.pathname.startsWith("/train/"); // also hide on the runner
  const showHeader = !hideHeaderOn.includes(location.pathname) && !isTrain;

  return (
    <>
      {showHeader && (
        <header className="header">
          <div className="inner">
            <b>Incident Response Training</b>
            <nav style={{ display: "flex", gap: 12 }}>
              <Link className="btn ghost" to="/">Home</Link>
              <Link className="btn primary" to="/login">Log in</Link>
            </nav>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/train/:id" element={<Train />} />

        {/* catch-all → Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}