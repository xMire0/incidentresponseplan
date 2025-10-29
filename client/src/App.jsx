// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Employee from "./pages/Employee.jsx";
import Train from "./pages/Train.jsx";
import AdminResults from "./pages/ViewResults.jsx";
import CreateScenario from "./pages/CreateScenario.jsx";
import GenerateReport from "./pages/GenerateReport.jsx";
import ViewScenario from "./pages/ViewScenario.jsx";
import ViewSpecificScenario from "./pages/ViewSpecificScenario.jsx";


export default function App() {
  const { pathname } = useLocation();

  // We hide the generic public header everywhere since each page has its own topbar.
  const hidePublicHeader =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/train/") ||
    pathname === "/login" ||
    pathname === "/employee" ||
    pathname === "/";

  return (
    <>
      {!hidePublicHeader && (
        <header className="header">
          <div className="inner">
            <b>Incident Response Training</b>
          </div>
        </header>
      )}

      <Routes>
        {/* Default landing → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/results" element={<AdminResults />} />
        <Route path="/admin/create" element={<CreateScenario />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/train/:id" element={<Train />} />
        <Route path="/admin/reports" element={<GenerateReport />} />
        <Route path="/admin/scenarios" element={<ViewScenario />} />
        <Route path="/admin/scenario/create" element={<CreateScenario />} />
        <Route path="/admin/scenario/:id" element={<ViewSpecificScenario />} />


        {/* Fallback → Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}