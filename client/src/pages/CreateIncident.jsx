// src/pages/CreateIncident.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./CreateIncident.css";

const STATUS_OPTIONS = [
  { value: "NotStarted", label: "Not started" },
  { value: "InProgress", label: "In progress" },
  { value: "Completed", label: "Completed" },
];

const toLocalDateTimeInput = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toISOOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export default function CreateIncident() {
  const { id: scenarioId } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);
  const [incident, setIncident] = useState({
    title: "",
    status: STATUS_OPTIONS[0].value,
    startedAt: "",
    completedAt: "",
  });

  useEffect(() => {
    if (!scenarioId) {
      setError("Scenario id is missing.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    api
      .get(`/api/scenarios/${scenarioId}`)
      .then(({ data }) => {
        if (!active) return;
        if (!data) {
          setError("Scenario not found.");
          setScenario(null);
          setIncident((prev) => ({ ...prev, title: "" }));
        } else {
          const scenarioTitle = data.title ?? data.Title ?? "Scenario";
          setScenario({
            id: data.id ?? data.Id ?? scenarioId,
            title: scenarioTitle,
            risk: data.risk ?? data.Risk ?? "",
            description: data.description ?? data.Description ?? "",
          });
          setIncident((prev) => ({ ...prev, title: `${scenarioTitle} — ${new Date().toLocaleDateString()}` }));
        }
      })
      .catch((err) => {
        console.error("Failed to load scenario", err);
        if (active) {
          setError("Could not load scenario details.");
          setScenario(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scenarioId]);

  const issues = useMemo(() => {
    const problems = [];
    if (!incident.title.trim()) problems.push("Incident title is required.");
    if (!scenarioId) problems.push("Scenario reference is missing.");
    if (incident.status === "Completed" && !incident.completedAt) {
      problems.push("Provide a completion time for completed incidents.");
    }
    return problems;
  }, [incident.title, incident.status, incident.completedAt, scenarioId]);

  const updateIncident = (patch) => setIncident((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (issues.length || !scenarioId) return;

    const payload = {
      scenarioId,
      title: incident.title.trim(),
      status: incident.status,
      startedAt: toISOOrNull(incident.startedAt),
      completedAt: toISOOrNull(incident.completedAt),
    };

    setSaving(true);
    setFlash(null);

    try {
      const { data } = await api.post("/api/incident", payload);
      const createdId = data ?? null;
      setFlash({ type: "ok", text: "Incident created successfully." });
      setTimeout(() => {
        navigate(createdId ? `/admin/incident/${createdId}` : `/admin/scenario/${scenarioId}/incidents`);
      }, 600);
    } catch (err) {
      console.error("Failed to create incident", err);
      setFlash({ type: "err", text: "Failed to create incident. Please try again." });
    } finally {
      setSaving(false);
    }
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

  if (error || !scenario) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="panel">
            <h3 className="panel-title">Create incident</h3>
            <p>{error ?? "Scenario not found."}</p>
            <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
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

          <div className="row gap">
            <button className="btn-outlined" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || issues.length > 0}
              title={issues.join("\n")}
            >
              {saving ? "Creating…" : "Create Incident"}
            </button>
          </div>
        </div>
      </div>

      <div className="container create-wrap">
        <h1 className="page-title">Create New Incident</h1>
        <p className="page-subtitle">
          Based on scenario: <b>{scenario.title}</b>
        </p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}
        {issues.length > 0 && (
          <div className="issues">
            <b>Please fix before saving:</b>
            <ul>
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="panel">
          <h3 className="panel-title">Incident Details</h3>

          <div className="form-row">
            <label>Incident Title</label>
            <input
              className="input"
              value={incident.title}
              placeholder="Example: Ransomware Detected — October 2025"
              onChange={(e) => updateIncident({ title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label>Status</label>
            <select
              className="input"
              value={incident.status}
              onChange={(e) => updateIncident({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Start Date</label>
            <input
              type="datetime-local"
              className="input"
              value={incident.startedAt}
              onChange={(e) => updateIncident({ startedAt: e.target.value })}
              max={incident.completedAt || undefined}
            />
          </div>

          <div className="form-row">
            <label>Completion Date</label>
            <input
              type="datetime-local"
              className="input"
              value={incident.completedAt}
              onChange={(e) => updateIncident({ completedAt: e.target.value })}
              min={incident.startedAt || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
