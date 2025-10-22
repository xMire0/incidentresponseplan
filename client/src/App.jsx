// src/App.jsx
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Employee from "./pages/Employee.jsx";
import Train from "./pages/Train.jsx";
import AdminResults from "./pages/ViewResults.jsx"; // <- your View Results page

export default function App() {
  const { pathname } = useLocation();

  const hidePublicHeader =
    pathname.startsWith("/admin") ||   // hide on all admin pages
    pathname === "/login" ||
    pathname === "/employee" ||
    pathname.startsWith("/train/");

  return (
    <>
      {!hidePublicHeader && (
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
        <Route path="/admin/results" element={<AdminResults />} /> {/* <- */}
        <Route path="/employee" element={<Employee />} />
        <Route path="/train/:id" element={<Train />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}