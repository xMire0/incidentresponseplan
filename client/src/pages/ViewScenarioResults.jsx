// src/pages/ViewScenarioResults.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewScenarioResults.css";

export default function ViewScenarioResults() {
  const { id } = useParams(); // scenario id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  // Mock data - senere skal det hentes fra backend (f.eks. /api/results?scenarioId=id)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockData = [
        {
          id: "run-001",
          scenarioId: "scn-001",
          scenarioTitle: "Ransomware Detected",
          userEmail: "alice@captureone.com",
          score: 42,
          maxScore: 50,
          pct: 84,
          status: "pass",
          completedAt: "2025-10-20T16:12:00Z",
        },
        {
          id: "run-002",
          scenarioId: "scn-001",
          scenarioTitle: "Ransomware Detected",
          userEmail: "mark@captureone.com",
          score: 35,
          maxScore: 50,
          pct: 70,
          status: "pass",
          completedAt: "2025-10-21T11:05:00Z",
        },
      ];
      const filtered = mockData.filter((r) => r.scenarioId === id);
      setResults(filtered);
      setLoading(false);
    }, 300);
  }, [id]);

  if (loading)
    return (
      <div className="admin-root">
        <div className="container">Loading results…</div>
      </div>
    );

  if (results.length === 0)
    return (
      <div className="admin-root">
        <div className="container">
          <h1>No results for this scenario yet</h1>
          <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
            ← Back
          </button>
        </div>
      </div>
    );

  const title = results[0].scenarioTitle;

  return (
    <div className="admin-root">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="brand">
            <span className="brand-name">AdminPro</span>
          </div>
          <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
            ← Back
          </button>
        </div>
      </div>

      <div className="container">
        <h1 className="page-title">{title} — Results</h1>
        <p className="page-subtitle">Overview of all participants and their scores.</p>

        <div className="panel">
          <table className="result-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.userEmail}</td>
                  <td>{r.score}/{r.maxScore} ({r.pct}%)</td>
                  <td>
                    <span className={`pill ${r.status}`}>
                      {r.status === "pass" ? "Pass" : "Fail"}
                    </span>
                  </td>
                  <td>{new Date(r.completedAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-ghost"
                      onClick={() => navigate(`/admin/incident/${r.Id}`)}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
