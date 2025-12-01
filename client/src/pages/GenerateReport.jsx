// src/pages/GenerateReport.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./GenerateReport.css";

/* ---------- Helper function for generating IDs ---------- */
function cryptoRandom() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/* ---------- Map backend IncidentResultDto to component format ---------- */
function mapResultToRun(result) {
  // Capitalize status: "pass" -> "Pass", "fail" -> "Fail"
  const verdict = result.status 
    ? result.status.charAt(0).toUpperCase() + result.status.slice(1).toLowerCase()
    : "Fail";
  
  // Handle date: use CompletedAt, fallback to current date if null
  const date = result.completedAt 
    ? new Date(result.completedAt).toISOString()
    : new Date().toISOString();
  
  return {
    id: result.id || cryptoRandom(),
    user: result.userEmail || "Unknown user",
    scenario: result.scenarioTitle || result.incidentTitle || "Unknown scenario",
    score: result.score || 0,
    max: result.maxScore || 0,
    pct: result.pct || 0,
    verdict: verdict,
    date: date,
  };
}

/* ---------- Filters + helpers ---------- */
const GROUPS = [
  { key: "none", label: "No grouping" },
  { key: "user", label: "By user" },
  { key: "scenario", label: "By scenario" },
  { key: "day", label: "By day" },
  { key: "week", label: "By week" },
  { key: "month", label: "By month" },
];

export default function GenerateReport() {
  const navigate = useNavigate();

  // State for data, loading, and errors
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from API
  useEffect(() => {
    let active = true;
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const { data } = await api.get("/api/incident/results");
        
        if (!active) return;
        
        // Map IncidentResultDto[] to component format
        const mappedRuns = Array.isArray(data) 
          ? data.map(mapResultToRun)
          : [];
        
        setRuns(mappedRuns);
      } catch (err) {
        console.error("Failed to load incident results", err);
        if (!active) return;
        setError(err.response?.data?.message || err.message || "Failed to load data");
        setRuns([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    
    fetchData();
    
    return () => {
      active = false;
    };
  }, []);

  // filter state
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState("All scenarios");
  const [verdict, setVerdict] = useState("All verdicts");
  const [minPct, setMinPct] = useState(0);
  const [start, setStart] = useState(""); // yyyy-mm-dd
  const [end, setEnd] = useState("");     // yyyy-mm-dd
  const [groupBy, setGroupBy] = useState("none");
  const [includeRaw, setIncludeRaw] = useState(true);

  const scenarios = useMemo(() => {
    const s = Array.from(new Set(runs.map(r => r.scenario))).sort();
    return ["All scenarios", ...s];
  }, [runs]);

  const filtered = useMemo(() => {
    let out = runs.slice();

    if (scenario !== "All scenarios") out = out.filter(r => r.scenario === scenario);
    if (verdict !== "All verdicts") out = out.filter(r => r.verdict === verdict);
    if (minPct > 0) out = out.filter(r => r.pct >= minPct);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(r =>
        r.user.toLowerCase().includes(q) || r.scenario.toLowerCase().includes(q)
      );
    }
    if (start) {
      const s = new Date(start + "T00:00:00Z").getTime();
      out = out.filter(r => new Date(r.date).getTime() >= s);
    }
    if (end) {
      const e = new Date(end + "T23:59:59Z").getTime();
      out = out.filter(r => new Date(r.date).getTime() <= e);
    }
    return out.sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [runs, scenario, verdict, minPct, query, start, end]);

  const kpis = useMemo(() => {
    if (!filtered.length) return { avg: 0, passRate: 0, count: 0 };
    const avg = Math.round(filtered.reduce((s,r)=>s+r.pct,0)/filtered.length);
    const passRate = Math.round(
      (filtered.filter(r=>r.verdict==="Pass").length/filtered.length)*100
    );
    return { avg, passRate, count: filtered.length };
  }, [filtered]);

  /* ---------- Grouping ---------- */
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;

    const bucketKey = (r) => {
      if (groupBy === "user") return r.user;
      if (groupBy === "scenario") return r.scenario;
      if (groupBy === "day") return r.date.slice(0, 10); // YYYY-MM-DD
      if (groupBy === "week") {
        const d = new Date(r.date);
        const first = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const day = Math.floor((d - first) / 86400000);
        const wk = Math.ceil((day + first.getUTCDay() + 1) / 7);
        return `${d.getUTCFullYear()}-W${wk}`;
      }
      if (groupBy === "month") return r.date.slice(0, 7); // YYYY-MM
      return "all";
    };

    const map = new Map();
    filtered.forEach(r => {
      const key = bucketKey(r);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });

    const rows = Array.from(map.entries()).map(([key, arr]) => {
      const total = arr.reduce((s,r)=>s+r.score,0);
      const max   = arr.reduce((s,r)=>s+r.max,0);
      const pass  = arr.filter(r=>r.verdict==="Pass").length;
      const avgPct = Math.round(arr.reduce((s,r)=>s+r.pct,0)/arr.length);
      return { key, count: arr.length, total, max, avgPct, passRate: Math.round((pass/arr.length)*100) };
    });

    return rows.sort((a,b)=>a.key.localeCompare(b.key));
  }, [filtered, groupBy]);

  /* ---------- Export ---------- */
  const exportCSV = () => {
    const rows = includeRaw && filtered.length ? filtered : [];
    const headBase = grouped
      ? ["Group","Rows","Total Points","Max Points","Avg %","Pass rate %"]
      : ["User","Scenario","Score","Max","%","Verdict","Date ISO"];
    const lines = [];

    if (grouped) {
      lines.push(headBase.join(","));
      grouped.forEach(g=>{
        lines.push(csv([g.key, g.count, g.total, g.max, g.avgPct, g.passRate]));
      });
      if (includeRaw) lines.push(""); // empty line
    }

    if (rows.length) {
      if (!grouped) lines.push(headBase.join(","));
      rows.forEach(r=>{
        lines.push(csv([r.user, r.scenario, r.score, r.max, r.pct, r.verdict, r.date]));
      });
    }
    download("report.csv", lines.join("\n"));
  };

  const exportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      filters: { scenario, verdict, minPct, start, end, groupBy },
      kpis,
      grouped: grouped ?? undefined,
      rows: includeRaw ? filtered : undefined,
    };
    download("report.json", JSON.stringify(data, null, 2), "application/json");
  };

  /* ---------- UI ---------- */
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

          <div className="row gap">
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              ← Back to dashboard
            </button>
            <div className="export-row">
              <button className="btn-primary" onClick={exportCSV}>Export CSV</button>
              <button className="btn-ghost" onClick={exportJSON}>Export JSON</button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container reports-wrap">
        <h1 className="page-title">Generate Reports</h1>
        <p className="page-subtitle">Filter, summarize, and export submissions.</p>

        {/* Loading state */}
        {loading && (
          <div className="panel">
            <div className="empty">Loading data...</div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="panel">
            <div className="empty" style={{ color: "#ef4444" }}>
              <h3>Error loading data</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* No data state */}
        {!loading && !error && runs.length === 0 && (
          <div className="panel">
            <div className="empty">No data available. Complete some incidents to see results here.</div>
          </div>
        )}

        {/* KPIs - only show if not loading and no error */}
        {!loading && !error && (
          <div className="metric-grid">
            <div className="metric">
              <div className="m-label">Average</div>
              <div className="m-value">{kpis.avg}%</div>
            </div>
            <div className="metric">
              <div className="m-label">Pass rate</div>
              <div className="m-value">{kpis.passRate}%</div>
            </div>
            <div className="metric">
              <div className="m-label">Rows</div>
              <div className="m-value">{kpis.count}</div>
            </div>
          </div>
        )}

        {/* Filters - only show if not loading and no error */}
        {!loading && !error && (
          <div className="panel">
            <div className="filters reports">
            <select className="input" value={scenario} onChange={e=>setScenario(e.target.value)}>
              {scenarios.map(s => <option key={s}>{s}</option>)}
            </select>

            <input
              className="input"
              placeholder="Search user or scenario…"
              value={query}
              onChange={e=>setQuery(e.target.value)}
            />

            <select className="input" value={verdict} onChange={e=>setVerdict(e.target.value)}>
              <option>All verdicts</option>
              <option>Pass</option>
              <option>Fail</option>
            </select>

            <input
              className="input"
              type="number"
              min="0"
              max="100"
              value={minPct}
              onChange={e=>setMinPct(Number(e.target.value))}
              placeholder="Min %"
              title="Minimum percentage"
            />

            <input
              className="input"
              type="date"
              value={start}
              onChange={e=>setStart(e.target.value)}
              title="Start date"
            />
            <input
              className="input"
              type="date"
              value={end}
              onChange={e=>setEnd(e.target.value)}
              title="End date"
            />

            <select className="input" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
              {GROUPS.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>

            <label className="chk">
              <input
                type="checkbox"
                checked={includeRaw}
                onChange={e=>setIncludeRaw(e.target.checked)}
              />
              <span>Include raw rows in export</span>
            </label>
          </div>
          </div>
        )}

        {/* Group summary (if any) - only show if not loading and no error */}
        {!loading && !error && groupBy !== "none" && (
          <div className="panel">
            <div className="group-head">
              <h3 className="panel-title">Grouped summary</h3>
              <span className="muted">{grouped ? grouped.length : 0} groups</span>
            </div>
            <div className="t-row g-head">
              <div>Group</div><div>Rows</div><div>Total</div><div>Max</div><div>Avg %</div><div>Pass rate</div>
            </div>
            <div className="group-body">
              {(grouped ?? []).map(g => (
                <div className="t-row g-row" key={g.key}>
                  <div className="mono">{g.key}</div>
                  <div>{g.count}</div>
                  <div>{g.total}</div>
                  <div>{g.max}</div>
                  <div>{g.avgPct}%</div>
                  <div>{g.passRate}%</div>
                </div>
              ))}
              {!grouped?.length && <div className="empty">No groups to display.</div>}
            </div>
          </div>
        )}

        {/* Raw rows - only show if not loading and no error */}
        {!loading && !error && (
          <div className="panel">
          <div className="group-head">
            <h3 className="panel-title">Rows</h3>
            <span className="muted">{filtered.length} items</span>
          </div>

          <div className="t-head sticky">
            <div className="t-row">
              <div>User</div>
              <div>Scenario</div>
              <div className="right">Score</div>
              <div className="right">%</div>
              <div>Verdict</div>
              <div>Date</div>
            </div>
          </div>

          <div className="rows">
            {filtered.map(r => (
              <div className="t-row" key={r.id}>
                <div className="mono">{r.user}</div>
                <div>{r.scenario}</div>
                <div className="right">{r.score}/{r.max}</div>
                <div className="right">{r.pct}%</div>
                <div><span className={`pill ${r.verdict==="Pass" ? "pass":"fail"}`}>{r.verdict}</span></div>
                <div className="mono">{new Date(r.date).toLocaleString()}</div>
              </div>
            ))}
            {!filtered.length && <div className="empty">No rows match the current filters.</div>}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- utils ---------- */
function csv(arr) {
  return arr
    .map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    })
    .join(",");
}
function download(filename, content, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}