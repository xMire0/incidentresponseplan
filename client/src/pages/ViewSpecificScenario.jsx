// src/pages/ViewSpecificScenario.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import "./ViewSpecificScenario.css";

const RISK_LABELS = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Extreme",
};

const PRIORITY_LABELS = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Urgent",
};

function normaliseScenario(raw) {
  if (!raw) return null;

  const questions = Array.isArray(raw.questions ?? raw.Questions)
    ? (raw.questions ?? raw.Questions).map((q) => ({
        id: ensureId(q.id ?? q.Id, "question"),
        text: q.text ?? q.Text ?? "Untitled question",
        priority: normalisePriority(q.priority ?? q.Priority),
        roles: extractRoles(q),
        options: Array.isArray(q.answerOptions ?? q.AnswerOptions)
          ? (q.answerOptions ?? q.AnswerOptions).map((o) => ({
              id: ensureId(o.id ?? o.Id, "option"),
              text: o.text ?? o.Text ?? "",
              isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
              weight: o.weight ?? o.Weight ?? 0,
            }))
          : [],
      }))
    : [];

  return {
    id: ensureId(raw.id ?? raw.Id, "scenario"),
    title: raw.title ?? raw.Title ?? "Untitled scenario",
    description: raw.description ?? raw.Description ?? "",
    risk: normaliseRisk(raw.risk ?? raw.Risk),
    createdAt: raw.createdAt ?? raw.CreatedAt ?? null,
    questions,
  };
}

function normaliseRisk(value) {
  if (typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return RISK_LABELS[value] ?? "Unknown";
}

function normalisePriority(value) {
  if (typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return PRIORITY_LABELS[value] ?? "Unspecified";
}

function extractRoles(question) {
  const roles = question.questionRoles ?? question.QuestionRoles;
  if (!Array.isArray(roles)) return [];
  return roles
    .map((qr) => qr.role ?? qr.Role)
    .filter(Boolean)
    .map((role) => role.name ?? role.Name)
    .filter(Boolean);
}

function ensureId(value, prefix) {
  if (value) return value;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ViewSpecificScenario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        setError(null);
        const { data } = await api.get(`/api/scenarios/${id}`);
        if (!active) return;
        setScenario(normaliseScenario(data));
      } catch (err) {
        console.error("Failed to fetch scenario", err);
        if (!active) return;
        setScenario(null);
        setError("Could not load scenario details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      active = false;
    };
  }, [id]);

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
            <button className="btn-outlined" onClick={() => navigate(`/admin/scenario/${id}/incidents`)}>
              View Incidents
            </button>
          </div>
        </div>
      </div>

      <div className="container create-wrap">
        {loading ? (
          <div className="panel">
            <h3 className="panel-title">Loading scenario…</h3>
            <div className="skeleton-panel" />
          </div>
        ) : error ? (
          <div className="panel">
            <h3 className="panel-title">Error</h3>
            <p>{error}</p>
            <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
              ← Back
            </button>
          </div>
        ) : !scenario ? (
          <div className="panel">
            <h3 className="panel-title">Scenario not found</h3>
            <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
              ← Back
            </button>
          </div>
        ) : (
          <>
            <h1 className="page-title">{scenario.title}</h1>
            <p className="page-subtitle">View detailed scenario information.</p>

            <div className="panel">
              <h3 className="panel-title">Scenario details</h3>
              <div>
                <b>Risk:</b> {scenario.risk}
              </div>
              <div>
                <b>Description:</b> {scenario.description || "No description provided."}
              </div>
              <div>
                <b>Questions:</b> {scenario.questions.length}
              </div>
              <div>
                <b>Created:</b>{" "}
                {scenario.createdAt ? new Date(scenario.createdAt).toLocaleString() : "—"}
              </div>
            </div>

            <div className="panel">
              <h3 className="panel-title">Questions</h3>
              {scenario.questions.length === 0 ? (
                <div className="empty">No questions have been added to this scenario yet.</div>
              ) : (
                scenario.questions.map((q, qi) => (
                  <div key={q.id ?? qi} className="q-card">
                    <div className="q-header">
                      <div>
                        <b>Q{qi + 1}:</b> {q.text}
                      </div>
                      <span className="pill">{q.priority}</span>
                    </div>

                    {q.roles.length > 0 && (
                      <div className="muted tiny">Roles: {q.roles.join(", ")}</div>
                    )}

                    {q.options.length === 0 ? (
                      <div className="muted tiny">No answer options defined.</div>
                    ) : (
                      <ul>
                        {q.options.map((o) => (
                          <li key={o.id}>
                            <span>{o.text}</span>{" "}
                            <span className="muted tiny">
                              {o.isCorrect ? "Correct answer" : `Weight ${o.weight}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
