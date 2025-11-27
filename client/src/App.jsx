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
import ViewSpecificIncident from "./pages/ViewSpecificIncident.jsx";
import ViewScenarioResults from "./pages/ViewScenarioResults.jsx";
import EditSpecificScenario from "./pages/EditSpecificScenario.jsx";
import CreateIncident from "./pages/CreateIncident.jsx";
import ViewIncidents from "./pages/ViewIncidents.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import UserDetails from "./pages/UserDetails.jsx";






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
        <Route path="/admin/incident/:id" element={<ViewSpecificIncident />} />
        <Route path="/admin/scenario/:id/results" element={<ViewScenarioResults />} />
        <Route path="/admin/scenario/:id/edit" element={<EditSpecificScenario />} />
        <Route path="/admin/scenario/:id/create-incident" element={<CreateIncident />} />
        <Route path="/admin/scenario/:id/incidents" element={<ViewIncidents />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/:id" element={<UserDetails />} />







        {/* Fallback → Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}