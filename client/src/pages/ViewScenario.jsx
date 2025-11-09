// src/pages/ViewScenario.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ViewScenario.css";

const RISK_LABELS = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Extreme",
};

function normaliseScenario(raw) {
  const id = raw?.id ?? raw?.Id ?? crypto.randomUUID();
  const riskValue = raw?.risk ?? raw?.Risk;
  const riskLabel =
    typeof riskValue === "string"
      ? riskValue.charAt(0).toUpperCase() + riskValue.slice(1)
      : RISK_LABELS[riskValue] ?? "Unknown";

  const questions = raw?.questions ?? raw?.Questions;
  const incidents = raw?.incidents ?? raw?.Incidents;

  const lastUpdated = raw?.updatedAt ?? raw?.UpdatedAt ?? raw?.createdAt ?? raw?.CreatedAt ?? null;

  return {
    id,
    title: raw?.title ?? raw?.Title ?? "Untitled scenario",
    risk: riskLabel,
    lastUpdated,
    questionCount: Array.isArray(questions) ? questions.length : 0,
    incidentCount: Array.isArray(incidents) ? incidents.length : 0,
  };
}

export default function ViewScenario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;

    async function load() {
      setLoading(true);
      try {
        setError(null);
        const { data } = await api.get("/api/scenarios");
        if (!live) return;
        const list = Array.isArray(data) ? data.map(normaliseScenario) : [];
        setScenarios(list);
      } catch (err) {
        console.error("Failed to fetch scenarios", err);
        if (!live) return;
        setScenarios([]);
        setError("Could not load scenarios. Please try again.");
      } finally {
        if (live) setLoading(false);
      }
    }

    load();
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter((s) => !q || s.title.toLowerCase().includes(q));
  }, [scenarios, query]);

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;

    try {
      await api.delete(`/api/scenarios/${id}`);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      setFlash({ type: "ok", text: "Scenario deleted successfully." });
    } catch (err) {
      console.error("Failed to delete scenario", err);
      setFlash({ type: "err", text: "Failed to delete scenario." });
    } finally {
      setTimeout(() => setFlash(null), 1600);
    }
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

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              ← Back to dashboard
            </button>
            <button className="btn-primary" onClick={() => navigate("/admin/scenario/create")}>
              + Create new scenario
            </button>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        <h1 className="page-title">Scenario Management</h1>
        <p className="page-subtitle">View and manage all incident response scenarios.</p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}
        {error && <div className="flash err">{error}</div>}

        <div className="filters">
          <input
            className="input"
            placeholder="Search scenario…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="skeleton-panel" />
        ) : filtered.length === 0 ? (
          <div className="empty">No scenarios found.</div>
        ) : (
          <div className="vs-table">
            <div className="vs-head">
              <div className="c c1">Title</div>
              <div className="c c2">Risk</div>
              <div className="c c3">Created</div>
              <div className="c c4">Actions</div>
            </div>

            {filtered.map((s) => (
              <div className="vs-row" key={s.id}>
                <div className="c c1">
                  <div>{s.title}</div>
                  <div className="muted tiny">
                    {s.questionCount} questions • {s.incidentCount} incidents
                  </div>
                </div>
                <div className="c c2">
                  <span className="pill">{s.risk}</span>
                </div>
                <div className="c c3">
                  <div className="muted tiny">
                    {s.lastUpdated ? new Date(s.lastUpdated).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="c c4">
                  <button className="btn-ghost" onClick={() => navigate(`/admin/scenario/${s.id}`)}>
                    View
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => navigate(`/admin/scenario/${s.id}/incidents`)}
                  >
                    View incidents
                  </button>

                  <button className="btn-ghost" onClick={() => remove(s.id)}>
                    Delete
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
