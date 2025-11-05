// src/pages/EditSpecificScenario.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./EditSpecificScenario.css";

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

export default function EditSpecificScenario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const found = mockScenarios.find((s) => s.id === id);
    setScenario(found ? { ...found } : null);
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

  const handleSave = () => {
    console.log("Saving scenario:", scenario);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            <button className="btn-outlined" onClick={() => navigate(`/admin/scenario/${id}`)}>
              ← Back to view
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {saved ? "Saved ✅" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="container create-wrap">
        <h1 className="page-title">Edit Scenario</h1>
        <p className="page-subtitle">Modify metadata, questions, and scoring.</p>

        <div className="panel">
          <h3 className="panel-title">Scenario details</h3>

          <div className="form-row">
            <label>Title</label>
            <input
              className="input"
              value={scenario.title}
              onChange={(e) => setScenario({ ...scenario, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label>Risk</label>
            <select
              className="input"
              value={scenario.risk}
              onChange={(e) => setScenario({ ...scenario, risk: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              className="input"
              rows={3}
              value={scenario.description}
              onChange={(e) => setScenario({ ...scenario, description: e.target.value })}
            />
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Questions</h3>
          {scenario.questions.map((q, qi) => (
            <div key={q.id} className="q-card">
              <b>Q{qi + 1}</b>
              <input
                className="input"
                value={q.text}
                onChange={(e) => {
                  const updated = [...scenario.questions];
                  updated[qi].text = e.target.value;
                  setScenario({ ...scenario, questions: updated });
                }}
              />
              <ul>
                {q.options.map((o, oi) => (
                  <li key={o.id}>
                    <input
                      className="input small"
                      value={o.text}
                      onChange={(e) => {
                        const updated = [...scenario.questions];
                        updated[qi].options[oi].text = e.target.value;
                        setScenario({ ...scenario, questions: updated });
                      }}
                    />
                    <select
                      className="input small"
                      value={o.kind}
                      onChange={(e) => {
                        const updated = [...scenario.questions];
                        updated[qi].options[oi].kind = e.target.value;
                        setScenario({ ...scenario, questions: updated });
                      }}
                    >
                      <option value="correct">correct</option>
                      <option value="incorrect">incorrect</option>
                      <option value="partial">partial</option>
                    </select>
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
