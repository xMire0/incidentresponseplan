// src/pages/ViewSpecificIncident.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewSpecificIncident.css";


export default function ViewSpecificIncident() {
  const { id } = useParams(); // Incident ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);

  // --- MOCK DATA ---
  const mockIncidents = {
    "inc-001": {
      id: "inc-001",
      title: "Ransomware Detected — October 2025",
      scenario: "Ransomware Detected",
      status: "Completed",
      startedAt: "2025-10-19T10:30:00Z",
      completedAt: "2025-10-21T15:45:00Z",
      participants: [
        {
          name: "Alice Jensen",
          totalScore: 42,
          maxScore: 50,
          answers: [
            {
              question: "What is your first action when detecting ransomware activity?",
              selected: "Disconnect affected servers from the network.",
              correct: true,
              points: 10,
            },
            {
              question: "When should management be informed?",
              selected: "Immediately after detection to escalate response.",
              correct: true,
              points: 10,
            },
          ],
        },
        {
          name: "Mark Hansen",
          totalScore: 35,
          maxScore: 50,
          answers: [
            {
              question: "What is your first action when detecting ransomware activity?",
              selected: "Run antivirus across all systems.",
              correct: false,
              points: 2,
            },
            {
              question: "When should management be informed?",
              selected: "Only after resolution.",
              correct: false,
              points: 2,
            },
          ],
        },
      ],
    },
  };
  // -----------------

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setIncident(mockIncidents[id]);
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

  if (!incident) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Incident data not found.</p>
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
          <button className="btn-outlined" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>

      <div className="container results-wrap">
        <h1 className="page-title">{incident.title}</h1>
        <p className="page-subtitle">
          Overview of incident details, participants, and their responses.
        </p>

        {/* Incident Info */}
        <div className="panel">
          <h3 className="panel-title">Incident Info</h3>
          <div className="summary-stats">
            <div>
              <b>Scenario:</b> {incident.scenario}
            </div>
            <div>
              <b>Status:</b>{" "}
              <span
                className={`pill ${
                  incident.status === "Completed"
                    ? "green"
                    : incident.status === "Active"
                    ? "amber"
                    : "red"
                }`}
              >
                {incident.status}
              </span>
            </div>
            <div>
              <b>Started:</b>{" "}
              {new Date(incident.startedAt).toLocaleDateString("en-GB")}
            </div>
            <div>
              <b>Completed:</b>{" "}
              {new Date(incident.completedAt).toLocaleDateString("en-GB")}
            </div>
            <div>
              <b>Participants:</b> {incident.participants.length}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="panel">
          <h3 className="panel-title">Responses</h3>
          {incident.participants.map((p) => (
            <div key={p.name} className="participant-card">
              <div className="participant-head">
                <h4>{p.name}</h4>
                <span className="pill">{p.totalScore} / {p.maxScore} pts</span>
              </div>

              <div className="answers-list">
                {p.answers.map((a, i) => (
                  <details
                    key={i}
                    className={`answer-row ${a.correct ? "correct" : "incorrect"}`}
                  >
                    <summary className="q-summary">
                      Q{i + 1}: {a.question}
                    </summary>
                    <div className="q-body">
                      <div>
                        <b>Answer:</b> {a.selected}
                      </div>
                      <div>
                        <b>Points:</b> {a.points}
                      </div>
                      <div className={`verdict ${a.correct ? "ok" : "bad"}`}>
                        {a.correct ? "✓ Correct" : "✗ Incorrect"}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
