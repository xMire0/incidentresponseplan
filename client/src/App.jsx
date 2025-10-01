// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";   // your new Admin component
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <>
      <header className="header">
        <div className="inner">
          <b>Incident Response Training</b>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link className="btn ghost" to="/">Home</Link>
            <Link className="btn primary" to="/admin">Admin (test)</Link>
            <Link className="btn ghost" to="/login">Log in</Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}