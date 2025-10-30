// src/pages/ViewResultsSpecific.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewResultsSpecific.css";

export default function ViewResultsSpecific() {
  const { id } = useParams(); // scenario id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  // Mock data — this will later come from backend (e.g. GET /api/results/:scenarioId)
  const mockResults = {
    "scn-001": {
      id: "scn-001",
      title: "Ransomware Detected",
      totalScore: 40,
      maxScore: 50,
      status: "Passed",
      participants: [
        {
          name: "Alice Jensen",
          score: 42,
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
          score: 35,
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
    "scn-003": {
      id: "scn-003",
      title: "Data Breach — S3 Bucket",
      totalScore: 48,
      maxScore: 60,
      status: "Passed",
      participants: [
        {
          name: "Lucas Madsen",
          score: 50,
          answers: [
            {
              question: "What’s the immediate step after detecting exposed data?",
              selected: "Revoke access keys and isolate bucket.",
              correct: true,
              points: 10,
            },
          ],
        },
      ],
    },
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setResult(mockResults[id]);
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

  if (!result) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Result data not found for this scenario.</p>
          <button className="btn-outlined" onClick={() => navigate("/admin/results")}>
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
            <button className="btn-outlined" onClick={() => navigate("/admin/results")}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="container results-wrap">
        <h1 className="page-title">{result.title}</h1>
        <p className="page-subtitle">Detailed overview of scenario performance and responses.</p>

        <div className="summary">
          <div className="panel">
            <h3 className="panel-title">Overview</h3>
            <div className="summary-stats">
              <div><b>Status:</b> <span className={`pill ${result.status === "Passed" ? "green" : "red"}`}>{result.status}</span></div>
              <div><b>Total Score:</b> {result.totalScore} / {result.maxScore}</div>
              <div><b>Participants:</b> {result.participants.length}</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Participant Results</h3>
          {result.participants.map((p) => (
            <div key={p.name} className="participant-card">
              <div className="participant-head">
                <h4>{p.name}</h4>
                <span className="pill">{p.score} pts</span>
              </div>
              <div className="answers-list">
                {p.answers.map((a, i) => (
                  <div key={i} className={`answer-row ${a.correct ? "correct" : "incorrect"}`}>
                    <div className="q-text">{a.question}</div>
                    <div className="a-text">{a.selected}</div>
                    <div className="points">{a.points} pts</div>
                    <div className={`verdict ${a.correct ? "ok" : "bad"}`}>
                      {a.correct ? "✓ Correct" : "✗ Incorrect"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
