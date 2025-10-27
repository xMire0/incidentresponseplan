import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewResults.css";

/* ── Mock API (replace with your real endpoints later) ───────────────────── */
const SCENARIOS = [
  { id: "scn-001", title: "Ransomware Detected", maxScore: 50 },
  { id: "scn-002", title: "Phishing Attack on Email", maxScore: 40 },
  { id: "scn-003", title: "Data Breach — S3 Bucket", maxScore: 60 },
];

const NAMES = ["alex", "sam", "noah", "morgan", "jordan", "taylor", "chris"];
const DOMAINS = ["acme.com", "contoso.com", "globex.io", "mail.test"];
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

async function fetchResults() {
  await new Promise(r => setTimeout(r, 350));
  // fabricate ~90 rows
  const rows = Array.from({ length: 90 }).map((_, i) => {
    const s = pick(SCENARIOS);
    const score = rand(0, s.maxScore);
    const pct = Math.round((score / s.maxScore) * 100);
    const email = `${pick(NAMES)}.${rand(1, 999)}@${pick(DOMAINS)}`;
    const date = new Date(Date.now() - rand(0, 45) * 86400000); // within 45 days
    const durationSec = rand(4, 25) * 60 + rand(0, 59);
    const detail = mockDetail(s, score); // per-question mock
    return {
      id: `run-${i.toString().padStart(3, "0")}`,
      userEmail: email,
      scenarioId: s.id,
      scenarioTitle: s.title,
      score,
      maxScore: s.maxScore,
      pct,
      status: pct >= 70 ? "pass" : "fail",
      completedAt: date.toISOString(),
      durationSec,
      detail,
    };
  });
  return rows.sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt));
}

function mockDetail(sc, score) {
  // fake 5 questions with correctness distribution based on score %
  const qn = 5;
  const pct = Math.round((score / sc.maxScore) * 100);
  const probs = pct >= 80 ? [1,1,1,1,0.7] : pct >= 60 ? [1,1,0.7,0.4,0.2] : [1,0.6,0.3,0.2,0.1];
  return Array.from({length: qn}).map((_,i)=>({
    qid: `q${i+1}`,
    text: `Question ${i+1} about ${sc.title}`,
    chosen: ["A","B","C","D"][rand(0,3)],
    verdict: Math.random() < probs[i] ? "correct" : (Math.random()<0.25?"partial":"incorrect"),
    points:  (v => v==="correct"?10:v==="partial"?5:0)(Math.random()<probs[i]? "correct": (Math.random()<0.25?"partial":"incorrect")),
    max: 10
  }));
}
/* ───────────────────────────────────────────────────────────────────────── */

export default function ViewResults() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // filters
  const [scenario, setScenario] = useState("all");
  const [q, setQ]         = useState("");        // search
  const [verdict, setVerdict] = useState("all"); // pass|fail|all
  const [from, setFrom]   = useState("");        // YYYY-MM-DD
  const [to, setTo]       = useState("");        // YYYY-MM-DD

  // paging & sorting
  const [page, setPage]   = useState(1);
  const pageSize = 12;
  const [sort, setSort]   = useState({ by: "completedAt", dir: "desc" });

  const [open, setOpen]   = useState(null); // selected run for drawer

  useEffect(() => {
    let live = true;
    fetchResults().then(list => { if (live) { setRows(list); setLoading(false); }});
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (scenario !== "all" && r.scenarioId !== scenario) return false;
      if (verdict !== "all" && r.status !== verdict) return false;
      if (q && !(`${r.userEmail} ${r.scenarioTitle}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (from && new Date(r.completedAt) < new Date(from)) return false;
      if (to   && new Date(r.completedAt) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [rows, scenario, q, verdict, from, to]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a,b)=>{
      const dir = sort.dir === "asc" ? 1 : -1;
      const A = a[sort.by], B = b[sort.by];
      if (sort.by === "completedAt") return (new Date(A) - new Date(B))*dir;
      if (typeof A === "string") return A.localeCompare(B) * dir;
      return (A - B) * dir;
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  useEffect(()=>{ setPage(1); }, [scenario, q, verdict, from, to]);

  // metrics
  const metrics = useMemo(()=>{
    const n = filtered.length || 1;
    const avgPct = Math.round(filtered.reduce((s,r)=>s+r.pct,0) / n);
    const passRate = Math.round(filtered.filter(r=>r.status==="pass").length / n * 100);
    const runs = filtered.length;
    return { avgPct, passRate, runs };
  }, [filtered]);

  const setSortBy = (by) => {
    setSort(s => s.by === by ? { by, dir: s.dir === "asc" ? "desc":"asc" } : { by, dir: "desc" });
  };

  if (loading) {
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
            <button className="btn-outlined" onClick={()=>navigate("/admin")}>← Back to dashboard</button>
          </div>
        </div>
        <div className="container vr-wrap">
          <h1 className="page-title">View Results</h1>
          <p className="page-subtitle">Review submissions, filter, and drill into details.</p>
          <div className="skeleton-panel"/>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {/* Topbar */}
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
          <button className="btn-outlined" onClick={()=>navigate("/admin")}>← Back to dashboard</button>
        </div>
      </div>

      <div className="container vr-wrap">
        <h1 className="page-title">View Results</h1>
        <p className="page-subtitle">Review submissions, filter, and drill into details.</p>

        {/* Metrics */}
        <div className="metric-grid">
          <div className="metric">
            <div className="m-label">Average</div>
            <div className="m-value">{metrics.avgPct}%</div>
          </div>
          <div className="metric">
            <div className="m-label">Pass rate</div>
            <div className="m-value">{metrics.passRate}%</div>
          </div>
          <div className="metric">
            <div className="m-label">Completed runs</div>
            <div className="m-value">{metrics.runs}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters panel">
          <select className="input" value={scenario} onChange={e=>setScenario(e.target.value)}>
            <option value="all">All scenarios</option>
            {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>

          <input
            className="input"
            placeholder="Search user or scenario…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />

          <select className="input" value={verdict} onChange={e=>setVerdict(e.target.value)}>
            <option value="all">All verdicts</option>
            <option value="pass">Pass (≥70%)</option>
            <option value="fail">Fail (&lt;70%)</option>
          </select>

          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input className="input" type="date" value={to}   onChange={e=>setTo(e.target.value)} />
        </div>

        {/* Table */}
        <div className="panel table-wrap">
          <div className="table">
            <div className="t-head sticky">
              <div className="t-row">
                <div className="c user" onClick={()=>setSortBy("userEmail")}>User {sort.by==="userEmail" ? arrow(sort.dir):null}</div>
                <div className="c scen" onClick={()=>setSortBy("scenarioTitle")}>Scenario {sort.by==="scenarioTitle" ? arrow(sort.dir):null}</div>
                <div className="c score" onClick={()=>setSortBy("pct")}>Score {sort.by==="pct" ? arrow(sort.dir):null}</div>
                <div className="c verdict" onClick={()=>setSortBy("status")}>Verdict {sort.by==="status" ? arrow(sort.dir):null}</div>
                <div className="c date" onClick={()=>setSortBy("completedAt")}>Date {sort.by==="completedAt" ? arrow(sort.dir):null}</div>
                <div className="c act">Action</div>
              </div>
            </div>

            {pageRows.length === 0 ? (
              <div className="empty">No results match your filters.</div>
            ) : (
              <div className="t-body">
                {pageRows.map(r => (
                  <div className="t-row" key={r.id}>
                    <div className="c user">
                      <span className="avatar">{r.userEmail[0].toUpperCase()}</span>
                      <div className="u">
                        <b>{r.userEmail}</b>
                        <small className="muted">{r.id}</small>
                      </div>
                    </div>

                    <div className="c scen">
                      <div><b>{r.scenarioTitle}</b></div>
                      <small className="muted">Max {r.maxScore} pts</small>
                    </div>

                    <div className="c score">
                      <div className="bar"><span style={{width:`${r.pct}%`}}/></div>
                      <b>{r.score}/{r.maxScore}</b>
                      <small>{r.pct}%</small>
                    </div>

                    <div className="c verdict">
                      <span className={`pill ${r.status}`}>{r.status === "pass" ? "Pass" : "Fail"}</span>
                    </div>

                    <div className="c date">
                      {new Date(r.completedAt).toLocaleDateString()}<br/>
                      <small className="muted">{fmtDuration(r.durationSec)}</small>
                    </div>

                    <div className="c act">
                      <button className="btn-ghost" onClick={()=>setOpen(r)}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="pager">
            <button className="btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <div className="muted">Page {page} / {totalPages}</div>
            <button className="btn-ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <div className="drawer" role="dialog" aria-modal="true">
          <div className="drawer-panel">
            <div className="drawer-head">
              <b>Result details</b>
              <button className="btn-ghost" onClick={()=>setOpen(null)}>Close</button>
            </div>

            <div className="drawer-meta">
              <div>
                <div className="muted">User</div>
                <div>{open.userEmail}</div>
              </div>
              <div>
                <div className="muted">Scenario</div>
                <div>{open.scenarioTitle}</div>
              </div>
              <div>
                <div className="muted">Score</div>
                <div><b>{open.score}</b> / {open.maxScore} ({open.pct}%)</div>
              </div>
              <div>
                <div className="muted">Date</div>
                <div>{new Date(open.completedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="q-list">
              {open.detail.map((q) => (
                <div className="q" key={q.qid}>
                  <div className="q-top">
                    <b>{q.qid}</b>
                    <span className={`pill ${q.verdict}`}>{labelFor(q.verdict)}</span>
                  </div>
                  <div className="q-text">{q.text}</div>
                  <div className="q-meta">
                    <span>Chosen: <b>{q.chosen}</b></span>
                    <span>Points: <b>{q.points}</b> / {q.max}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-actions">
              <button className="btn-outlined" onClick={()=>setOpen(null)}>Close</button>
            </div>
          </div>
          <div className="drawer-backdrop" onClick={()=>setOpen(null)}/>
        </div>
      )}
    </div>
  );
}

/* helpers */
function arrow(dir){ return <span className={`arr ${dir}`}/>; }
function fmtDuration(sec){
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}m ${s.toString().padStart(2,"0")}s`;
}
function labelFor(v){ return v==="correct" ? "Correct" : v==="partial" ? "Partial" : "Incorrect"; }