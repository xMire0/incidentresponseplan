// src/pages/UserDetails.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./UserDetails.css";

export default function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [expandedIncident, setExpandedIncident] = useState(null);

  useEffect(() => {
    if (id) loadUser();
  }, [id]);

  async function loadUser() {
    setLoading(true);
    try {
      setError(null);
      const { data } = await api.get(`/api/user/${id}`);
      setUser(data);
    } catch (err) {
      console.error("Failed to load user", err);
      setError("Could not load user details. Please try again.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const toggleIncident = (incidentId) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  if (loading) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="panel">
            <h3 className="panel-title">Error</h3>
            <p>{error || "User not found"}</p>
            <button className="btn-outlined" onClick={() => navigate("/admin/users")}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
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
            <button className="btn-outlined" onClick={() => navigate("/admin/users")}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        <h1 className="page-title">User Details</h1>
        <p className="page-subtitle">View user information, responses, and progress.</p>

        <div className="panel">
          <h3 className="panel-title">User Information</h3>
          <div className="summary-stats">
            <div>
              <b>Username:</b> {user.username}
            </div>
            <div>
              <b>Email:</b> {user.email || "—"}
            </div>
            <div>
              <b>Role:</b> <span className="pill">{user.roleName}</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Completed Incidents ({user.completedIncidents?.length || 0})</h3>
          {!user.completedIncidents || user.completedIncidents.length === 0 ? (
            <div className="muted tiny">No completed incidents yet.</div>
          ) : (
            <div className="incidents-list">
              {user.completedIncidents.map((incident) => (
                <div key={incident.incidentId} className="incident-card">
                  <button
                    className="incident-header"
                    onClick={() => toggleIncident(incident.incidentId)}
                  >
                    <div className="incident-info">
                      <div>
                        <b>{incident.incidentTitle}</b>
                        <div className="muted tiny">{incident.scenarioTitle}</div>
                      </div>
                      <div className="incident-meta">
                        <span className="pill">
                          {incident.score} / {incident.maxScore} pts ({incident.percentage}%)
                        </span>
                        {incident.completedAt && (
                          <span className="muted tiny">
                            {new Date(incident.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`chevron ${expandedIncident === incident.incidentId ? "open" : ""}`} aria-hidden />
                  </button>

                  {expandedIncident === incident.incidentId && (
                    <div className="incident-responses">
                      <h4>Responses</h4>
                      {incident.responses && incident.responses.length > 0 ? (
                        <div className="responses-list">
                          {incident.responses.map((response, idx) => (
                            <div key={idx} className={`response-item ${response.isCorrect ? "correct" : "incorrect"}`}>
                              <div className="response-question">
                                <b>Q{idx + 1}:</b> {response.questionText}
                              </div>
                              <div className="response-answer">
                                <b>Answer:</b> {response.answerText}
                                {response.isCorrect && <span className="tag correct">Correct</span>}
                                {!response.isCorrect && <span className="tag incorrect">Incorrect</span>}
                                <span className="muted tiny">{response.points} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="muted tiny">No responses recorded.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Pending Incidents ({user.pendingIncidents?.length || 0})</h3>
          {!user.pendingIncidents || user.pendingIncidents.length === 0 ? (
            <div className="muted tiny">No pending incidents.</div>
          ) : (
            <div className="incidents-list">
              {user.pendingIncidents.map((incident) => (
                <div key={incident.incidentId} className="incident-card pending">
                  <div className="incident-info">
                    <div>
                      <b>{incident.incidentTitle}</b>
                      <div className="muted tiny">{incident.scenarioTitle}</div>
                    </div>
                    <div className="incident-meta">
                      <span className="pill">{incident.status}</span>
                      {incident.startedAt && (
                        <span className="muted tiny">
                          Started: {new Date(incident.startedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

