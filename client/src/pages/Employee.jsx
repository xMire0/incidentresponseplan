// src/pages/Employee.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./employee.css";

/* Palette (auto-rotates if scenario.color missing) */
const THEME = [
  { from: "#67e8f9", to: "#60a5fa" }, // cyan → blue
  { from: "#34d399", to: "#10b981" }, // green
  { from: "#a78bfa", to: "#6366f1" }, // purple
  { from: "#f59e0b", to: "#ef4444" }, // amber → red
];
const pickColor = (i, override) => override ?? THEME[i % THEME.length];

/* LocalStorage key (shared with Train.jsx) */
const reviewKey = (id) => `train:result:${id}`;

/* Mock “API” – replace later */
async function fetchScenarios() {
  await new Promise(r => setTimeout(r, 450));
  return [
    { id:"scn-001", title:"Ransomware Detected",     difficulty:"Intermediate", tags:["Security","IR"],        est:"15–20 min", progress:0,   published:true },
    { id:"scn-002", title:"Phishing Attack on Email",difficulty:"Beginner",     tags:["Email","Awareness"],   est:"10–15 min", progress:42,  published:true },
    { id:"scn-003", title:"Data Breach – S3 Bucket", difficulty:"Advanced",     tags:["Cloud","Compliance"],  est:"25–30 min", progress:0,   published:true },
    { id:"scn-004", title:"DDoS on Public API",      difficulty:"Intermediate", tags:["Ops","Network"],       est:"15–25 min", progress:100, published:true }, // one finished to demo
  ];
}

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

  // ---- Optimized UI state (debounced + persisted) ----
  const saved = useRef(
    (() => {
      try { return JSON.parse(localStorage.getItem("emp-ui") || "{}"); }
      catch { return {}; }
    })()
  );
  const [rawSearch, setRawSearch] = useState(saved.current.q ?? "");
  const [q, setQ] = useState(saved.current.q ?? "");
  const [level, setLevel] = useState(saved.current.level ?? "All");

  useEffect(() => {
    const t = setTimeout(() => setQ(rawSearch), 250);
    return () => clearTimeout(t);
  }, [rawSearch]);

  useEffect(() => {
    localStorage.setItem("emp-ui", JSON.stringify({ q, level }));
  }, [q, level]);
  // -----------------------------------------------------

  useEffect(() => {
    let mount = true;
    fetchScenarios().then(list => {
      if (!mount) return;

      // Inject color + auto-detect completion from localStorage
      const pub = list
        .filter(s => s.published)
        .map((s, i) => {
          const color = pickColor(i, s.color);
          let status = s.status;
          let progress = s.progress;

          try {
            const saved = JSON.parse(localStorage.getItem(reviewKey(s.id)) || "null");
            if (saved?.answers) {
              status = "completed";
              progress = 100;
            }
          } catch {}

          return { ...s, color, status, progress };
        });

      setScenarios(pub);
      setLoading(false);
    });
    return () => { mount = false; };
  }, []);

  // Search + filter (applies to both sections)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return scenarios.filter(s => {
      const mQ = !query || s.title.toLowerCase().includes(query) || s.tags.join(" ").toLowerCase().includes(query);
      const mL = level === "All" || s.difficulty === level;
      return mQ && mL;
    });
  }, [q, level, scenarios]);

  // Split into active vs completed (structure only; visuals unchanged)
  const { active, completed } = useMemo(() => {
    const act = [];
    const comp = [];
    for (const s of filtered) {
      const done = s.status === "completed" || s.progress >= 100;
      (done ? comp : act).push(s);
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
          <h1 className="title">Available Tests</h1>
          <p className="subtitle">Pick a scenario and shine in your role-based incident response.</p>
        </div>
        <div className="h-right">
          <div className="search">
            <span className="s-ico"><IconSearch/></span>
            <input
              value={rawSearch}
              onChange={(e)=>setRawSearch(e.target.value)}
              placeholder="Search scenarios, tags…"
            />
          </div>
          <select className="select" value={level} onChange={(e)=>setLevel(e.target.value)}>
            <option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
      </div>

      {/* === SECTION 1: Begynd / Igangværende tests === */}
      <div className="container" style={{marginTop: 14}}>
        <div className="section-head" style={{display:"flex",alignItems:"center",gap:10,margin:"6px 0 10px"}}>
          <h2 style={{margin:0, fontSize:18, fontWeight:800}}>Begynd / Igangværende tests</h2>
          <span className="pill" aria-label="count">{active.length}</span>
        </div>

        <div className="grid">
          {loading ? (
            Array.from({length:3}).map((_,i) => <div className="card skeleton" key={i}/>)
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
                      <i>{s.progress ? `${s.progress}%` : "Not started"}</i>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-glow"
                      style={{ background: `linear-gradient(90deg, ${s.color.from}, ${s.color.to})` }}
                      onClick={() => startScenario(s)}
                    >
                      <span className="shine" />
                      {s.progress ? "Continue" : "Start test"}
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
          <h2 style={{margin:0, fontSize:18, fontWeight:800}}>Afsluttede tests</h2>
          <span className="pill" aria-label="count">{completed.length}</span>
        </div>

        <div className="grid">
          {loading ? (
            Array.from({length:2}).map((_,i) => <div className="card skeleton" key={i}/>)
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