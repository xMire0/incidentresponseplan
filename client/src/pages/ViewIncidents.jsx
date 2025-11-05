// src/pages/ViewIncidents.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewIncidents.css";

export default function ViewIncidents() {
  const navigate = useNavigate();
  const { id } = useParams(); // scenario ID
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(null);

  // --- MOCK DATA (kan senere udskiftes med API fra .NET backend) ---
  const mockData = {
    "scn-001": {
      id: "scn-001",
      title: "Ransomware Detected",
      risk: "Medium",
      incidents: [
        {
          id: "inc-001",
          title: "Incident — October 2025",
          date: "2025-10-21T09:30:00Z",
          status: "Completed",
          score: "42/50 (84%)",
          result: "Pass",
        },
        {
          id: "inc-002",
          title: "Incident — September 2025",
          date: "2025-09-17T15:10:00Z",
          status: "Completed",
          score: "35/50 (70%)",
          result: "Pass",
        },
      ],
    },
    "scn-002": {
      id: "scn-002",
      title: "Phishing Attack on Email",
      risk: "Low",
      incidents: [
        {
          id: "inc-003",
          title: "Incident — October 2025",
          date: "2025-10-18T10:00:00Z",
          status: "Active",
          score: "Pending",
          result: "Pending",
        },
      ],
    },
  };
  // ------------------------------------------------------------------

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const found = mockData[id];
      setScenario(found || null);
      setLoading(false);
    }, 400);
  }, [id]);

  if (loading) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Scenario not found.</p>
          <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
            ← Back
          </button>
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <h1 className="page-title">
          {scenario.title} — Incidents
        </h1>
        <p className="page-subtitle">
          View all recorded incidents for this scenario.
        </p>

        {scenario.incidents.length === 0 ? (
          <div className="empty">No incidents found for this scenario.</div>
        ) : (
          <div className="incidents-table">
            <div className="incidents-head">
              <div className="c c1">Title</div>
              <div className="c c2">Status</div>
              <div className="c c3">Score</div>
              <div className="c c4">Date</div>
              <div className="c c5">Actions</div>
            </div>

            {scenario.incidents.map((inc) => (
              <div className="incidents-row" key={inc.id}>
                <div className="c c1">{inc.title}</div>
                <div className="c c2">
                  <span
                    className={`pill ${
                      inc.status === "Completed"
                        ? "green"
                        : inc.status === "Active"
                        ? "amber"
                        : "red"
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>
                <div className="c c3">{inc.score}</div>
                <div className="c c4">
                  {new Date(inc.date).toLocaleDateString("en-GB")}
                </div>
                <div className="c c5">
                  <button
                    className="btn-ghost"
                    onClick={() => navigate(`/admin/incident/${inc.id}`)}
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
