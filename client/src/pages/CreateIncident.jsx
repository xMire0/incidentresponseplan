// src/pages/CreateIncident.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateIncident.css";

export default function CreateIncident() {
  const { id } = useParams(); // scenario ID
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [incident, setIncident] = useState({
    title: "",
    status: "Active",
    startedAt: "",
    description: "",
  });
  const [saved, setSaved] = useState(false);

  // --- MOCK scenario fetch ---
  useEffect(() => {
    setScenario({
      id: id,
      title: "Ransomware Detected",
      risk: "Medium",
      description: "Simulates a ransomware attack in a corporate environment.",
    });
  }, [id]);
  // ----------------------------

  const handleSave = () => {
    console.log("New incident created:", incident);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate(`/admin/scenario/${id}/incidents`);
    }, 1500);
  };

  if (!scenario) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Loading scenario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {/* Topbar */}
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#6b61ff" opacity="0.15" />
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6b61ff" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="brand-name">AdminPro</span>
          </div>

          <div className="row gap">
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {saved ? "Created ✅" : "Create Incident"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container create-wrap">
        <h1 className="page-title">Create New Incident</h1>
        <p className="page-subtitle">
          Based on scenario: <b>{scenario.title}</b>
        </p>

        <div className="panel">
          <h3 className="panel-title">Incident Details</h3>

          <div className="form-row">
            <label>Incident Title</label>
            <input
              className="input"
              value={incident.title}
              placeholder="Example: Ransomware Detected — October 2025"
              onChange={(e) => setIncident({ ...incident, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label>Status</label>
            <select
              className="input"
              value={incident.status}
              onChange={(e) => setIncident({ ...incident, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="form-row">
            <label>Start Date</label>
            <input
              type="datetime-local"
              className="input"
              value={incident.startedAt}
              onChange={(e) => setIncident({ ...incident, startedAt: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Describe what this incident simulates..."
              value={incident.description}
              onChange={(e) => setIncident({ ...incident, description: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
