// src/pages/ViewScenario.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewScenario.css";

async function fetchScenarios() {
  await new Promise(r => setTimeout(r, 300));
  return [
    { id:"scn-001", title:"Ransomware Detected", risk:"Medium", tags:["Security","IR"], est:"15–20 min", maxScore:50, sections:2, questions:5, updatedAt:"2025-10-20T14:12:00Z" },
    { id:"scn-002", title:"Phishing Attack on Email", risk:"Low",    tags:["Email","Awareness"], est:"10–15 min", maxScore:40, sections:1, questions:4, updatedAt:"2025-10-18T10:04:00Z" },
    { id:"scn-003", title:"Data Breach — S3 Bucket",  risk:"High",   tags:["Cloud","S3","Security"], est:"20–25 min", maxScore:60, sections:2, questions:6, updatedAt:"2025-10-17T08:30:00Z" },
  ];
}

export default function ViewScenario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    let live = true;
    fetchScenarios().then(list => {
      if (!live) return;
      setScenarios(list);
      setLoading(false);
    });
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter(s =>
      !q || s.title.toLowerCase().includes(q) || s.tags.join(" ").toLowerCase().includes(q)
    );
  }, [scenarios, query]);

  const remove = (id) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
    setFlash({ type:"ok", text:"Scenario deleted successfully." });
    setTimeout(() => setFlash(null), 1200);
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

          <div style={{display:"flex",gap:8}}>
            <button className="btn-outlined" onClick={()=>navigate("/admin")}>← Back to dashboard</button>
            <button className="btn-primary" onClick={()=>navigate("/admin/scenario/create")}>+ Create new scenario</button>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        <h1 className="page-title">Scenario Management</h1>
        <p className="page-subtitle">View and manage all incident response scenarios.</p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}

        <div className="filters">
          <input
            className="input"
            placeholder="Search scenario…"
            value={query}
            onChange={e=>setQuery(e.target.value)}
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
              <div className="c c3">Updated</div>
              <div className="c c4">Actions</div>
            </div>

            {filtered.map(s => (
              <div className="vs-row" key={s.id}>
                <div className="c c1">{s.title}</div>
                <div className="c c2"><span className="pill">{s.risk}</span></div>
                <div className="c c3"><div className="muted tiny">{new Date(s.updatedAt).toLocaleString()}</div></div>
                <div className="c c4">
  <button
    className="btn-ghost"
    onClick={() => navigate(`/admin/scenario/${s.id}`)}
  >
    View
  </button>

  <button className="btn-ghost" onClick={() => navigate(`/admin/scenario/${s.id}/incidents`)}>
  View incidents
</button>


  <button
    className="btn-ghost"
    onClick={() => remove(s.id)}
  >
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
