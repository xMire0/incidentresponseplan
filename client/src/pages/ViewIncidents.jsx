// src/pages/ViewIncidents.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import "./ViewIncidents.css";

const STATUS_ENUM = {
  0: "NotStarted",
  1: "InProgress",
  2: "Completed",
};

const STATUS_PILLS = {
  NotStarted: "amber",
  InProgress: "blue",
  Completed: "green",
};

function normaliseIncident(raw) {
  if (!raw) return null;
  const statusValue = raw.status ?? raw.Status;
  const statusKey =
    typeof statusValue === "string"
      ? statusValue
      : STATUS_ENUM[statusValue] ?? "Unknown";
  const status = humaniseStatus(statusKey);

  const startedAt = raw.startedAt ?? raw.StartedAt ?? null;
  const completedAt = raw.completedAt ?? raw.CompletedAt ?? null;

  const responses = Array.isArray(raw.responses ?? raw.Responses)
    ? (raw.responses ?? raw.Responses)
    : [];

  // Tæl unikke brugere (participants) - kun én gang per user, ikke per response
  const uniqueUserIds = new Set();
  
  responses.forEach((r) => {
    const user = r.user ?? r.User ?? null;
    const userId = user?.id ?? user?.Id ?? null;
    
    // Kun tæl userId hvis den findes - hver unik user tælles kun én gang
    if (userId) {
      uniqueUserIds.add(userId);
    }
  });

  return {
    title: raw.title ?? raw.Title ?? "Untitled incident",
    id: ensureId(raw.id ?? raw.Id, "incident"),
    statusKey,
    status,
    startedAt,
    completedAt,
    participantCount: uniqueUserIds.size,
  };
}

function ensureId(value, prefix) {
  if (value) return value;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function humaniseStatus(key) {
  if (!key) return "Unknown";
  const lookup = {
    NotStarted: "Not started",
    InProgress: "In progress",
    Completed: "Completed",
  };
  if (lookup[key]) return lookup[key];
  // fallback: split camel case
  return key.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function ViewIncidents() {
  const navigate = useNavigate();
  const { id } = useParams(); // scenario ID
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;

    async function load() {
      setLoading(true);
      try {
        setError(null);

        const [scenarioRes, incidentsRes] = await Promise.all([
          api.get(`/api/scenarios/${id}`),
          api.get(`/api/scenarios/${id}/incidents`),
        ]);

        if (!live) return;

        setScenario(scenarioRes.data ?? null);
        const list = Array.isArray(incidentsRes.data)
          ? incidentsRes.data.map(normaliseIncident)
          : [];
        setIncidents(list);
      } catch (err) {
        console.error("Failed to load incidents", err);
        if (!live) return;
        setError("Could not load incidents for this scenario.");
        setScenario(null);
        setIncidents([]);
      } finally {
        if (live) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      live = false;
    };
  }, [id]);

  const statusClass = (statusKey) => STATUS_PILLS[statusKey] ?? "muted";

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
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="skeleton-panel" />
        ) : error ? (
          <div className="panel">
            <h3 className="panel-title">Error</h3>
            <p>{error}</p>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              Back to dashboard
            </button>
          </div>
        ) : !scenario ? (
          <div className="panel">
            <h3 className="panel-title">Scenario not found</h3>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              Back to dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 className="page-title">
              {scenario.title ?? scenario.Title} — Incidents
            </h1>
            <p className="page-subtitle">View all recorded incidents for this scenario.</p>

            {incidents.length === 0 ? (
              <div className="empty">No incidents found for this scenario.</div>
            ) : (
              <div className="incidents-table">
                <div className="incidents-head">
                  <div className="c c1">Title</div>
                  <div className="c c2">Status</div>
                  <div className="c c3">Started</div>
                  <div className="c c4">Completed</div>
                  <div className="c c5">Actions</div>
                </div>

                {incidents.map((inc) => (
                  <div className="incidents-row" key={inc.id}>
                    <div className="c c1">
                      <div className="row">
                        <div>
                          <b>{inc.title}</b>
                        </div>
                      </div>
                    </div>
                    <div className="c c2">
                      <span className={`pill ${statusClass(inc.statusKey)}`}>{inc.status}</span>
                    </div>
                    <div className="c c3">
                      {inc.startedAt ? new Date(inc.startedAt).toLocaleString() : "—"}
                    </div>
                    <div className="c c4">
                      {inc.completedAt ? new Date(inc.completedAt).toLocaleString() : "—"}
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
          </>
        )}
      </div>
    </div>
  );
}
