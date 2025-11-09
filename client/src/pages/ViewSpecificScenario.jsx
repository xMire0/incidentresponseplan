// src/pages/ViewSpecificScenario.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewSpecificScenario.css";

const mockScenarios = [
  {
    id: "scn-001",
    title: "Ransomware Detected",
    risk: "Medium",
    description: "Simulates a ransomware incident in a corporate environment.",
    questions: [
      {
        id: "q1",
        text: "What is your first action when detecting ransomware activity?",
        options: [
          { id: "a", text: "Disconnect affected servers from the network.", kind: "correct" },
          { id: "b", text: "Run antivirus across all systems.", kind: "incorrect" },
        ],
      },
    ],
  },
  {
    id: "scn-002",
    title: "Phishing Attack on Email",
    risk: "Low",
    description: "Tests awareness and response to phishing attempts.",
    questions: [
      {
        id: "q1",
        text: "What should you do when you suspect a phishing email?",
        options: [
          { id: "a", text: "Report it to IT Security.", kind: "correct" },
          { id: "b", text: "Reply to confirm sender identity.", kind: "incorrect" },
        ],
      },
    ],
  },
  {
    id: "scn-003",
    title: "Data Breach — S3 Bucket",
    risk: "High",
    description: "Tests procedures for handling cloud data exposure.",
    questions: [
      {
        id: "q1",
        text: "What’s the immediate step after detecting exposed data?",
        options: [
          { id: "a", text: "Revoke access keys and isolate bucket.", kind: "correct" },
          { id: "b", text: "Ignore until external notification.", kind: "incorrect" },
        ],
      },
    ],
  },
];

export default function ViewSpecificScenario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    const found = mockScenarios.find((s) => s.id === id);
    setScenario(found || null);
  }, [id]);

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
            <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
              ← Back
            </button>
            <button className="btn-outlined" onClick={() => navigate(`/admin/scenario/${id}/edit`)}>
              ✏️ Edit Scenario
            </button>
            <button className="btn-primary" onClick={() => navigate(`/admin/scenario/${id}/create-incident`)}>
              + Create Incident
            </button>
            <button className="btn-outlined" onClick={() => navigate(`/admin/scenario/${id}/incidents`)} >
            View Incidents
            </button>

          </div>
        </div>
      </div>

      <div className="container create-wrap">
        <h1 className="page-title">{scenario.title}</h1>
        <p className="page-subtitle">View detailed scenario information.</p>

        <div className="panel">
          <h3 className="panel-title">Scenario details</h3>
          <div><b>Risk:</b> {scenario.risk}</div>
          <div><b>Description:</b> {scenario.description}</div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Questions</h3>
          {scenario.questions.map((q, qi) => (
            <div key={q.id} className="q-card">
              <b>Q{qi + 1}:</b> {q.text}
              <ul>
                {q.options.map((o) => (
                  <li key={o.id}>
                    <span>{o.text}</span> — <i>{o.kind}</i>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
