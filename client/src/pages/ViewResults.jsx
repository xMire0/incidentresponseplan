import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ViewResults.css";

async function fetchResults() {
  const { data } = await api.get("/api/incident/results");
  return Array.isArray(data) ? data : [];
}

export default function ViewResults() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const scenarioOptions = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      if (r.scenarioId && r.scenarioTitle)
        map.set(r.scenarioId, r.scenarioTitle);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rows]);
  const teamOptions = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      if (r.teamId && r.teamName)
        map.set(r.teamId, r.teamName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);
  const teamNameMap = useMemo(() => {
    const map = new Map();
    teamOptions.forEach(team => map.set(team.id, team.name));
    return map;
  }, [teamOptions]);

  // existing filters
  const [scenario, setScenario]   = useState("all");
  const [q, setQ]                 = useState("");
  const [verdict, setVerdict]     = useState("all");
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");

  // new: team + compare
  const [teamId, setTeamId]                 = useState("");       // main team filter ("" = all)
  const [compareMode, setCompareMode]       = useState("org");    // "org" | "team"
  const [compareTeamId, setCompareTeamId]   = useState("");

  // NEW: which cohort(s) to show in the table
  const [tableView, setTableView] = useState("team"); // "team" | "baseline" | "both"

  // table sort/paging
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [sort, setSort] = useState({ by: "completedAt", dir: "desc" });

  // drawer
  const [open, setOpen] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const toggleQuestion = useCallback((qid) => {
    setExpandedQuestionId((prev) => (prev === qid ? null : qid));
  }, []);

  useEffect(() => {
    setExpandedQuestionId(null);
  }, [open]);

  useEffect(() => {
    let live = true;
    fetchResults().then(list => {
      if (!live) return;
      setRows(list);
      setLoading(false);
    });
    return () => { live = false; };
  }, []);

  // predicate shared by current + comparison cohorts
  const basePredicate = useCallback((r) => {
    if (scenario !== "all" && r.scenarioId !== scenario) return false;
    if (verdict !== "all" && r.status !== verdict) return false;
    if (q && !(`${r.userEmail} ${r.scenarioTitle}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (from && new Date(r.completedAt) < new Date(from)) return false;
    if (to && new Date(r.completedAt) > new Date(`${to}T23:59:59`)) return false;
    return true;
  }, [scenario, verdict, q, from, to]);

  // filtered for the current view (selected team only)
  const filtered = useMemo(
    () => rows.filter(r => basePredicate(r) && (!teamId || r.teamId === teamId)),
    [rows, basePredicate, teamId]
  );

  // comparison cohorts
  const cohortOrg = useMemo(
    () => rows.filter(r => basePredicate(r)),
    [rows, basePredicate]
  );
  const cohortCompareTeam = useMemo(
    () => (compareMode === "team" && compareTeamId)
      ? rows.filter(r => basePredicate(r) && r.teamId === compareTeamId)
      : [],
    [rows, basePredicate, compareMode, compareTeamId]
  );

  // When compare is enabled/changed, default table to show both cohorts
  useEffect(() => {
    if (teamId && (compareMode === "org" || (compareMode === "team" && compareTeamId))) {
      setTableView("both");
    } else if (!teamId) {
      setTableView("team");
    }
  }, [teamId, compareMode, compareTeamId]);

  // metrics
  const calcMetrics = (list) => {
    const n = list.length || 1;
    const avgPct = Math.round(list.reduce((s, r) => s + r.pct, 0) / n);
    const passRate = Math.round(list.filter(r => r.status === "pass").length / n * 100);
    const runs = list.length;
    return { avgPct, passRate, runs };
  };

  const metrics = calcMetrics(filtered);
  const baselineList = (compareMode === "org") ? cohortOrg : cohortCompareTeam;
  const baseline = teamId
    ? calcMetrics(baselineList)
    : null;

  const deltas = baseline ? {
    avgPct: metrics.avgPct - baseline.avgPct,
    passRate: metrics.passRate - baseline.passRate,
    runs: metrics.runs - baseline.runs,
  } : null;

  // Build the actual table rows based on tableView
  const tableRows = useMemo(() => {
    // No team selected → just the normal filtered set
    if (!teamId) return filtered.map(r => ({ ...r, __cohort: "team" }));

    const teamRows = filtered.map(r => ({ ...r, __cohort: "team" }));

    // If baseline is Org and we are showing both, exclude selected team
    const baseRowsRaw = baselineList || [];
    const baseRowsFiltered =
      (compareMode === "org")
        ? baseRowsRaw.filter(r => r.teamId !== teamId)
        : baseRowsRaw;

    const baseRows = baseRowsFiltered.map(r => ({ ...r, __cohort: "baseline" }));

    if (tableView === "team") return teamRows;
    if (tableView === "baseline") return baseRows;
    return [...teamRows, ...baseRows]; // "both"
  }, [filtered, baselineList, tableView, compareMode, teamId]);

  // sort + page
  const sorted = useMemo(() => {
    const copy = [...tableRows];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const A = a[sort.by], B = b[sort.by];
      if (sort.by === "completedAt") return (new Date(A) - new Date(B)) * dir;
      if (typeof A === "string") return A.localeCompare(B) * dir;
      return (A - B) * dir;
    });
    return copy;
  }, [tableRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  useEffect(() => { setPage(1); }, [scenario, q, verdict, from, to, teamId, tableView, compareMode, compareTeamId]);

  const setSortBy = (by) => {
    setSort(s => s.by === by ? { by, dir: s.dir === "asc" ? "desc" : "asc" } : { by, dir: "desc" });
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
            <button className="btn-outlined" onClick={() => navigate("/admin")}>← Back to dashboard</button>
          </div>
        </div>
        <div className="container vr-wrap">
          <h1 className="page-title">View Results</h1>
          <p className="page-subtitle">Review submissions, filter, and drill into details.</p>
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  const teamName = teamId ? (teamNameMap.get(teamId) ?? "Team") : "";
  const rightTitle =
    compareMode === "org"
      ? "Org"
      : (compareTeamId ? (teamNameMap.get(compareTeamId) ?? "Team") : "Team");

  return (
    <>
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
            <button className="btn-outlined" onClick={() => navigate("/admin")}>← Back to dashboard</button>
          </div>
        </div>

        <div className="container vr-wrap">
          <h1 className="page-title">View Results</h1>
          <p className="page-subtitle">
            Review submissions, filter, and drill into details.
            {teamId && (
              <span className="muted" style={{ marginLeft: 10 }}>
                Viewing <b>{teamName}</b>
                {" • "}
                {compareMode === "org"
                  ? "vs Org"
                  : (compareTeamId
                  ? `vs ${teamNameMap.get(compareTeamId) ?? "Team"}`
                      : "(select a team to compare)")}
              </span>
            )}
          </p>

          {/* Metrics */}
          <div className="metric-grid">
            <div className="metric">
              <div className="m-label">Average</div>
              <div className="m-value">{metrics.avgPct}%</div>
              {deltas && <Delta label="vs baseline" value={deltas.avgPct} unit="pp" />}
            </div>
            <div className="metric">
              <div className="m-label">Pass rate</div>
              <div className="m-value">{metrics.passRate}%</div>
              {deltas && <Delta label="vs baseline" value={deltas.passRate} unit="pp" />}
            </div>
            <div className="metric">
              <div className="m-label">Completed runs</div>
              <div className="m-value">{metrics.runs}</div>
              {deltas && <Delta label="vs baseline" value={deltas.runs} />}
            </div>
          </div>

          {/* Compare panel */}
          {teamId && deltas && (
            <ComparePanel
              leftTitle={teamName}
              left={metrics}
              rightTitle={rightTitle}
              right={baseline}
              showTeamGrid={compareMode === "team" && !compareTeamId}
              teams={teamOptions.filter(t => t.id !== teamId)}
              onPickTeam={setCompareTeamId}
            />
          )}

          {/* Filters */}
          <div className="filters panel">
            {/* Existing filter row */}
            <select className="input" value={scenario} onChange={e => setScenario(e.target.value)}>
              <option value="all">All scenarios</option>
              {scenarioOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Search user or scenario…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />

            <select className="input" value={verdict} onChange={e => setVerdict(e.target.value)}>
              <option value="all">All verdicts</option>
              <option value="pass">Pass (≥70%)</option>
              <option value="fail">Fail (&lt;70%)</option>
            </select>

            <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <input className="input" type="date" value={to}   onChange={e => setTo(e.target.value)} />

            {/* Second row: Team + Compare controls */}
            <div className="inline">
              <select
                className="input sm"
                value={teamId}
                onChange={(e) => {
                  const v = e.target.value;
                  setTeamId(v);
                  if (!v) {
                    setCompareTeamId("");
                    setTableView("team");
                  }
                }}
                title="Filter by team"
              >
                <option value="">All teams</option>
                {teamOptions.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-ghost"
                disabled={!teamId}
                onClick={() => {
                  setCompareMode(m => (m === "org" ? "team" : "org"));
                  setTableView("both");
                }}
                title={teamId ? "Toggle compare mode" : "Select a team to compare"}
              >
                {compareMode === "org" ? "Team vs Org" : "Team vs Team"}
              </button>

              {compareMode === "team" && !!teamId && (
                <select
                  className="input sm"
                  value={compareTeamId}
                  onChange={(e) => {
                    setCompareTeamId(e.target.value);
                    setTableView("both");
                  }}
                  title="Compare against…"
                >
                  <option value="" disabled>Select team to compare</option>
                  {teamOptions
                    .filter(t => t.id !== teamId)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              )}

              {/* Which rows to show in the table (ACTIVE state added) */}
              {teamId && (
                <div style={{ display:"flex", gap:8 }}>
                  <button
                    type="button"
                    className={`btn-ghost ${tableView === "team" ? "is-active" : ""}`}
                    aria-pressed={tableView === "team"}
                    onClick={() => setTableView("team")}
                    title="Show only selected team"
                  >
                    Team only
                  </button>

                  <button
                    type="button"
                    className={`btn-ghost ${tableView === "baseline" ? "is-active" : ""}`}
                    aria-pressed={tableView === "baseline"}
                    disabled={(compareMode === "team" && !compareTeamId)}
                    onClick={() => setTableView("baseline")}
                    title="Show only baseline"
                  >
                    {compareMode === "org" ? "Org only" : "Other team only"}
                  </button>

                  <button
                    type="button"
                    className={`btn-ghost ${tableView === "both" ? "is-active" : ""}`}
                    aria-pressed={tableView === "both"}
                    disabled={(compareMode === "team" && !compareTeamId)}
                    onClick={() => setTableView("both")}
                    title="Show both cohorts"
                  >
                    Both
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="panel table-wrap">
            <div className="table">
              <div className="t-head sticky">
                <div className="t-row">
                  <div className="c user"   onClick={() => setSortBy("userEmail")}>User {sort.by==="userEmail" ? arrow(sort.dir) : null}</div>
                  <div className="c scen"   onClick={() => setSortBy("scenarioTitle")}>Scenario {sort.by==="scenarioTitle" ? arrow(sort.dir) : null}</div>
                  <div className="c score"  onClick={() => setSortBy("pct")}>Score {sort.by==="pct" ? arrow(sort.dir) : null}</div>
                  <div className="c verdict"onClick={() => setSortBy("status")}>Verdict {sort.by==="status" ? arrow(sort.dir) : null}</div>
                  <div className="c date"   onClick={() => setSortBy("completedAt")}>Date {sort.by==="completedAt" ? arrow(sort.dir) : null}</div>
                  <div className="c act">Action</div>
                </div>
              </div>

              {pageRows.length === 0 ? (
                <div className="empty">No results match your filters.</div>
              ) : (
                <div className="t-body">
                  {pageRows.map(r => {
                    const teamLabel = r.teamName || teamNameMap.get(r.teamId) || "—";
                    return (
                    <div className="t-row" key={r.id + "-" + r.__cohort}>
                      <div className="c user">
                        <span className="avatar">{r.userEmail[0].toUpperCase()}</span>
                        <div className="u">
                          <b>{r.userEmail}</b>
                          <small className="muted">Team: {teamLabel}</small>
                          {/* cohort tag with leading space to avoid jammed text */}
                          {teamId && (
                            <small className="muted">
                              {" "}{r.__cohort === "team" ? "Selected team" : rightTitle}
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="c scen">
                        <div><b>{r.scenarioTitle}</b></div>
                        <small className="muted">Max {r.maxScore} pts</small>
                      </div>

                      <div className="c score">
                        <div className="bar"><span style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} /></div>
                        <b>{r.score}/{r.maxScore}</b>
                        <small>{r.pct}%</small>
                      </div>

                      <div className="c verdict">
                        <span className={`pill ${r.status}`}>{r.status === "pass" ? "Pass" : "Fail"}</span>
                      </div>

                      <div className="c date">
                        {new Date(r.completedAt).toLocaleDateString()}<br />
                        <small className="muted">{fmtDuration(r.durationSec)}</small>
                      </div>

                      <div className="c act">
                        <button className="btn-ghost" onClick={() => setOpen(r)}>View</button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="pager">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <div className="muted">Page {page} / {totalPages}</div>
              <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer (sibling overlay) */}
      {open && (
        <div className="drawer" role="dialog" aria-modal="true">
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <b>Result details</b>
              <button className="btn-ghost" onClick={() => setOpen(null)}>Close</button>
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
              {(open.detail ?? []).map((q, idx) => {
                const qid = String(q.qid || q.questionId || idx);
                const isOpen = expandedQuestionId === qid;
                const options = Array.isArray(q.options) ? q.options : [];
                const chosenSummary = options.filter((opt) => opt.isChosen).map((opt) => opt.text).join(", ") || q.chosen;
                return (
                  <div className={`q ${isOpen ? "is-open" : ""}`} key={qid}>
                    <button
                      type="button"
                      className="q-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQuestion(qid);
                      }}
                    >
                      <div className="q-info">
                        <small className="muted">Question {idx + 1}</small>
                        <div className="q-text">{q.text}</div>
                        <div className="q-meta">
                          <span>Chosen: <b>{chosenSummary || "—"}</b></span>
                          <span>Points: <b>{q.points}</b> / {q.max}</span>
                        </div>
                      </div>
                      <div className="q-right">
                        <span className={`pill ${q.verdict}`}>{labelFor(q.verdict)}</span>
                        <span className={`chevron ${isOpen ? "open" : ""}`} aria-hidden />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="q-options">
                        {options.length === 0 ? (
                          <div className="q-option muted">No answer options available.</div>
                        ) : (
                          options.map((opt) => {
                            const optionKey = opt.optionId || opt.id || opt.text;
                            const classes = [
                              "q-option",
                              opt.isChosen ? "chosen" : "",
                              opt.isCorrect ? "correct" : "",
                            ].filter(Boolean).join(" ");

                            return (
                              <div className={classes} key={optionKey}>
                                <div>
                                  <b>{opt.text || "Option"}</b>
                                  <small className="muted">
                                    {opt.isCorrect ? "Correct answer" : "Answer choice"}
                                  </small>
                                </div>
                                <div className="q-option-meta">
                                  {opt.isChosen && <span className="tag chosen">Chosen</span>}
                                  {opt.isCorrect && <span className="tag correct">Correct</span>}
                                  <span className="muted">{opt.points ?? 0} pts</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="drawer-actions">
              <button className="btn-outlined" onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
          <div 
            className="drawer-backdrop" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(null);
              }
            }}
          />
        </div>
      )}
    </>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function arrow(dir){ return <span className={`arr ${dir}`} />; }

function fmtDuration(sec){
  const total = Number(sec);
  if (!Number.isFinite(total) || total <= 0) return "0m 00s";
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}m ${s.toString().padStart(2,"0")}s`;
}

function labelFor(v){
  return v === "correct" ? "Correct" : v === "partial" ? "Partial" : "Incorrect";
}

// tiny KPI delta chip
function Delta({ value, unit = "", label }) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const tone = value > 0 ? "ok" : value < 0 ? "err" : "muted";
  return (
    <div className={`delta ${tone}`} title={label} style={{ marginTop: 6 }}>
      {sign}{abs}{unit}
    </div>
  );
}

/* Compare panel component */
function ComparePanel({ leftTitle, left, rightTitle, right, showTeamGrid, teams, onPickTeam }) {
  const bar = (pct) => (
    <div className="bar" aria-hidden><span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
  );

  return (
    <div className="kpi-compare">
      <div className="side">
        <div className="title">{leftTitle}</div>
        <div className="row"><span>Average</span><b>{left.avgPct}%</b></div>
        {bar(left.avgPct)}
        <div className="row" style={{ marginTop: 8 }}><span>Pass rate</span><b>{left.passRate}%</b></div>
        {bar(left.passRate)}
        <div className="row" style={{ marginTop: 8 }}><span>Completed runs</span><b>{left.runs}</b></div>
      </div>

      <div className="side">
        <div className="title">{rightTitle}</div>
        <div className="row"><span>Average</span><b>{right.avgPct}%</b></div>
        {bar(right.avgPct)}
        <div className="row" style={{ marginTop: 8 }}><span>Pass rate</span><b>{right.passRate}%</b></div>
        {bar(right.passRate)}
        <div className="row" style={{ marginTop: 8 }}><span>Completed runs</span><b>{right.runs}</b></div>

        {showTeamGrid && teams?.length > 0 && (
          <div className="team-list">
            {teams.map(t => (
              <button
                key={t.id}
                className="team-tile"
                type="button"
                onClick={() => onPickTeam?.(t.id)}
                title={`Compare with ${t.name}`}
              >
                <div className="k">Compare with</div>
                <div><b>{t.name}</b></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}