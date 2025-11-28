// src/pages/Employee.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./employee.css";

/* Palette (auto-rotates if scenario.color missing) */
const THEME = [
  { from: "#67e8f9", to: "#60a5fa" }, // cyan → blue
  { from: "#34d399", to: "#10b981" }, // green
  { from: "#a78bfa", to: "#6366f1" }, // purple
  { from: "#f59e0b", to: "#ef4444" }, // amber → red
];
const pickColor = (i, override) => override ?? THEME[i % THEME.length];

const STATUS_META = {
  NotStarted: { label: "Not started", className: "muted", progress: 0 },
  InProgress: { label: "In progress", className: "amber", progress: 50 },
  Completed: { label: "Completed", className: "green", progress: 100 },
};

const normaliseIncident = (incident, index, userHasRespondedMap = {}) => {
  if (!incident) return null;

  const id = incident.id ?? incident.Id ?? null;
  const scenario = incident.scenario ?? incident.Scenario ?? {};
  // Prioritize incident.title over scenario.title
  const title = incident.title ?? incident.Title ?? scenario.title ?? scenario.Title ?? "Untitled incident";
  const risk = scenario.risk ?? scenario.Risk ?? "Medium";
  const difficulty = typeof risk === "string" ? risk : String(risk);
  const tags = Array.from(
    new Set(
      (scenario.questions ?? scenario.Questions ?? []).flatMap((question) => {
        const roles = Array.isArray(question.questionRoles ?? question.QuestionRoles)
          ? question.questionRoles ?? question.QuestionRoles
          : [];
        return roles
          .map((roleLink) => roleLink.role?.name ?? roleLink.role?.Name ?? roleLink.Role?.name ?? roleLink.Role?.Name)
          .filter(Boolean);
      })
    )
  );
  const est = (scenario.questions ?? scenario.Questions)?.length
    ? `${Math.max(5, (scenario.questions ?? scenario.Questions).length * 5)}–${Math.max(10, (scenario.questions ?? scenario.Questions).length * 7)} min`
    : "10–15 min";

  const rawStatus = incident.status ?? incident.Status ?? "NotStarted";
  const statusKey = typeof rawStatus === "string" ? rawStatus : String(rawStatus);
  const statusMeta = STATUS_META[statusKey] ?? STATUS_META.NotStarted;

  // Check if user has responded (backend check)
  const userHasResponded = userHasRespondedMap[id] === true;
  
  let progress = statusMeta.progress;
  if (userHasResponded) {
    progress = 100; // User has responded, mark as completed
  }

  return {
    id,
    title,
    difficulty,
    tags: tags.length ? tags : [difficulty],
    est,
    statusKey: userHasResponded ? "Completed" : statusKey, // Override status if user has responded
    statusLabel: userHasResponded ? "Completed" : statusMeta.label,
    statusClass: userHasResponded ? "green" : statusMeta.className,
    progress,
    color: pickColor(index, scenario.color),
  };
};

/* Icons */
const IconLogout = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M10 7v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2"
      stroke="#E9EEF5" strokeWidth="1.6" fill="none"/>
    <path d="M15 12H3m0 0l3-3m-3 3l3 3"
      stroke="#E9EEF5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <circle cx="11" cy="11" r="7" stroke="#a6b0bf" strokeWidth="1.6" fill="none"/>
    <path d="M20 20l-3.2-3.2" stroke="#a6b0bf" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconSpark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 3l2.1 4.6L19 9l-4.1 1.4L12 15l-2.9-4.6L5 9l4.9-1.4L12 3z" fill="white" opacity=".9"/>
  </svg>
);

export default function Employee() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [error, setError] = useState(null);

  // ---- Optimized UI state (debounced + persisted) ----
  const saved = useRef(
    (() => {
      try { return JSON.parse(localStorage.getItem("emp-ui") || "{}"); }
      catch { return {}; }
    })()
  );
  const [rawSearch, setRawSearch] = useState(saved.current.q ?? "");
  const [q, setQ] = useState(saved.current.q ?? "");
  const [statusFilter, setStatusFilter] = useState(saved.current.status ?? "All");

  useEffect(() => {
    const t = setTimeout(() => setQ(rawSearch), 250);
    return () => clearTimeout(t);
  }, [rawSearch]);

  useEffect(() => {
    localStorage.setItem("emp-ui", JSON.stringify({ q, statusFilter }));
  }, [q, statusFilter]);
  // -----------------------------------------------------

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (statusFilter !== "All") params.status = statusFilter;
        const { data } = await api.get("/api/incident", { params });
        if (!active) return;
        const incidents = Array.isArray(data) ? data : [];
        
        // Check backend for each incident if user has responded
        const userHasRespondedMap = {};
        if (user?.email) {
          await Promise.all(
            incidents.map(async (incident) => {
              const incidentId = incident.id ?? incident.Id;
              if (!incidentId) return;
              try {
                const params = new URLSearchParams();
                params.append("userEmail", user.email);
                const { data: hasResponded } = await api.get(`/api/response/check/${incidentId}?${params.toString()}`);
                if (hasResponded === true) {
                  userHasRespondedMap[incidentId] = true;
                }
              } catch (err) {
                console.warn(`Failed to check response status for incident ${incidentId}`, err);
                // Continue even if check fails
              }
            })
          );
        }
        
        const mapped = incidents
          .map((incident, index) => normaliseIncident(incident, index, userHasRespondedMap))
          .filter(Boolean);
        setScenarios(mapped);
      } catch (err) {
        console.error("Failed to load incidents", err);
        if (active) {
          setError("Could not load incidents. Please try again later.");
          setScenarios([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [statusFilter, user]);

  // Search + filter (applies to both sections)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return scenarios.filter((scenario) => {
      const matchesQuery =
        !query ||
        scenario.title.toLowerCase().includes(query) ||
        scenario.tags.join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || scenario.statusKey === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [q, statusFilter, scenarios]);

  // Split into active vs completed (structure only; visuals unchanged)
  const { active, completed } = useMemo(() => {
    const act = [];
    const comp = [];
    for (const scenario of filtered) {
      const done = scenario.statusKey === "Completed" || scenario.progress >= 100;
      (done ? comp : act).push(scenario);
    }
    act.sort((a, b) => (b.progress === 0) - (a.progress === 0)); // in-progress first
    comp.sort((a, b) => a.title.localeCompare(b.title));
    return { active: act, completed: comp };
  }, [filtered]);

  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  const startScenario = (s) => navigate(`/train/${s.id}`);
  const reviewScenario = (s) => navigate(`/train/${s.id}?review=1`); // read-only view

  return (
    <div className="empX">
      {/* Ambient blobs */}
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <rect x="3" y="3" width="18" height="18" rx="5" fill="#6b61ff" opacity=".18" />
                <rect x="7" y="7" width="10" height="10" rx="3" stroke="#6b61ff" strokeWidth="1.6" />
              </svg>
            </span>
            <span className="brand-name">Training</span>
          </div>

          <div className="right">
            <div className="hello">
              <span className="pulse-dot" />
              Welcome{user?.email ? `, ${user.email}` : ""}
            </div>
            <button className="btn-ghost" onClick={onLogout}>
              <span className="ico"><IconLogout/></span> Log out
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container header-row">
        <div className="h-left">
          <h1 className="title">Available Incidents</h1>
          <p className="subtitle">Pick an incident and respond according to your role.</p>
        </div>
        <div className="h-right">
          <div className="search">
            <span className="s-ico"><IconSearch/></span>
            <input
              value={rawSearch}
              onChange={(e)=>setRawSearch(e.target.value)}
              placeholder="Search incidents, tags…"
            />
          </div>
          <select className="select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="NotStarted">Not started</option>
            <option value="InProgress">In progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* === SECTION 1: Begynd / Igangværende tests === */}
      <div className="container" style={{marginTop: 14}}>
        <div className="section-head" style={{display:"flex",alignItems:"center",gap:10,margin:"6px 0 10px"}}>
          <h2 style={{margin:0, fontSize:18, fontWeight:800}}>Open / In progress incidents</h2>
          <span className="pill" aria-label="count">{active.length}</span>
        </div>

        <div className="grid">
          {loading ? (
            Array.from({length:3}).map((_,i) => <div className="card skeleton" key={i}/>)
          ) : error ? (
            <div className="empty">
              <div className="empty-badge"><IconSpark/></div>
              <h3>Could not load incidents</h3>
              <p>{error}</p>
            </div>
          ) : active.length === 0 ? (
            <div className="empty">
              <div className="empty-badge"><IconSpark/></div>
              <h3>Ingen igangværende tests</h3>
              <p>Start en ny test fra listen ovenfor eller fjern filtre.</p>
            </div>
          ) : (
            active.map((s) => (
              <article className="card" key={s.id}>
                <span
                  className="card-border"
                  style={{ background: `linear-gradient(135deg, ${s.color.from}, ${s.color.to})` }}
                />
                <div className="card-inner">
                  <div className="card-top">
                    <span
                      className="aura"
                      style={{
                        background: `linear-gradient(135deg, ${s.color.from}, ${s.color.to})`,
                        boxShadow: `0 8px 28px ${toRgba(s.color.to, .35)}, inset 0 1px 0 rgba(255,255,255,.4)`
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22">
                        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="white" opacity="0.9" />
                        <circle cx="12" cy="12" r="5" fill="url(#gradSpark)" opacity="0.2" />
                        <defs>
                          <radialGradient id="gradSpark" cx="0.5" cy="0.5" r="0.5">
                            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </span>
                    <span className="pill">{s.difficulty}</span>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{s.title}</h3>
                    <p className="card-meta">{s.tags.join(" • ")} • {s.est}</p>

                    <div className={`meter ${s.progress ? "" : "muted"}`}>
                      <span
                        style={{
                          width: `${s.progress}%`,
                          background: `linear-gradient(90deg, ${s.color.from}, ${s.color.to})`
                        }}
                      />
                      <i>{s.progress ? `${s.progress}%` : s.statusLabel}</i>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-glow"
                      style={{ background: `linear-gradient(90deg, ${s.color.from}, ${s.color.to})` }}
                      onClick={() => startScenario(s)}
                    >
                      <span className="shine" />
                      {s.progress ? "Continue" : "Start incident"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* === SECTION 2: Afsluttede tests === */}
      <div className="container" style={{marginTop: 28, marginBottom: 28}}>
        <div className="section-head" style={{display:"flex",alignItems:"center",gap:10,margin:"6px 0 10px"}}>
          <h2 style={{margin:0, fontSize:18, fontWeight:800}}>Completed incidents</h2>
          <span className="pill" aria-label="count">{completed.length}</span>
        </div>

        <div className="grid">
          {loading ? (
            Array.from({length:2}).map((_,i) => <div className="card skeleton" key={i}/>)
          ) : error ? (
            <div className="empty">
              <div className="empty-badge"><IconSpark/></div>
              <h3>Could not load incidents</h3>
              <p>{error}</p>
            </div>
          ) : completed.length === 0 ? (
            <div className="empty">
              <div className="empty-badge"><IconSpark/></div>
              <h3>Ingen afsluttede tests endnu</h3>
              <p>Når du fuldfører en test, flyttes den hertil automatisk.</p>
            </div>
          ) : (
            completed.map((s) => (
              <article className="card" key={s.id}>
                <span
                  className="card-border"
                  style={{ background: `linear-gradient(135deg, ${s.color.from}, ${s.color.to})` }}
                />
                <div className="card-inner">
                  <div className="card-top">
                    <span
                      className="aura"
                      style={{
                        background: `linear-gradient(135deg, ${s.color.from}, ${s.color.to})`,
                        boxShadow: `0 8px 28px ${toRgba(s.color.to, .35)}, inset 0 1px 0 rgba(255,255,255,.4)`
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22">
                        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="white" opacity="0.9" />
                        <circle cx="12" cy="12" r="5" fill="url(#gradSpark)" opacity="0.2" />
                        <defs>
                          <radialGradient id="gradSpark" cx="0.5" cy="0.5" r="0.5">
                            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </span>
                    <span className="pill">{s.difficulty}</span>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{s.title}</h3>
                    <p className="card-meta">{s.tags.join(" • ")} • {s.est}</p>

                    <div className="meter">
                      <span
                        style={{
                          width: `100%`,
                          background: `linear-gradient(90deg, ${s.color.from}, ${s.color.to})`
                        }}
                      />
                      <i>100%</i>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => reviewScenario(s)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* util */
function toRgba(hex, a=1){
  const h = hex.replace("#",""); const n = h.length===3 ? h.split("").map(c=>c+c).join("") : h;
  const b = parseInt(n,16); const r=(b>>16)&255, g=(b>>8)&255, bl=b&255;
  return `rgba(${r},${g},${bl},${a})`;
}