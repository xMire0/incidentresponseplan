import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewScenario.css";

/** 🔌 Swap these with your real API calls later */
async function fetchScenarios() {
  // simulate http
  await new Promise(r => setTimeout(r, 300));
  // Pretend these came from DB: “published”
  return [
    {
      id: "scn-001",
      title: "Ransomware Detected",
      difficulty: "Intermediate",
      tags: ["Security", "IR"],
      est: "15–20 min",
      maxScore: 50,
      sections: 2,
      questions: 5,
      updatedAt: "2025-10-20T14:12:00Z",
    },
    {
      id: "scn-002",
      title: "Phishing Attack on Email",
      difficulty: "Beginner",
      tags: ["Email", "Awareness"],
      est: "10–15 min",
      maxScore: 40,
      sections: 1,
      questions: 4,
      updatedAt: "2025-10-18T10:04:00Z",
    },
    {
      id: "scn-003",
      title: "Data Breach — S3 Bucket",
      difficulty: "Advanced",
      tags: ["Cloud", "S3", "Security"],
      est: "20–25 min",
      maxScore: 60,
      sections: 2,
      questions: 6,
      updatedAt: "2025-10-17T08:30:00Z",
    },
  ];
}

/** 🔌 Example “send” endpoint payload you’ll POST later */
async function sendCampaignMock(payload) {
  await new Promise(r => setTimeout(r, 500));
  console.log("CAMPAIGN_SEND_PAYLOAD", payload);
  return { ok: true, campaignId: "cmp-" + Math.random().toString(36).slice(2, 8) };
}

export default function ViewScenario() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);
  const [active, setActive] = useState(null); // preview
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [selected, setSelected] = useState({}); // {id: true}
  const [recipients, setRecipients] = useState(""); // newline or comma separated
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    let live = true;
    fetchScenarios().then(list => {
      if (!live) return;
      setScenarios(list);
      setActive(list[0] ?? null);
      setLoading(false);
    });
    return () => { live = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter(s => {
      const matchesQ =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.tags.join(" ").toLowerCase().includes(q);
      const matchesD = difficulty === "All" || s.difficulty === difficulty;
      return matchesQ && matchesD;
    });
  }, [scenarios, query, difficulty]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter(id => selected[id]),
    [selected]
  );

  const toggleSelect = (id) =>
    setSelected(s => ({ ...s, [id]: !s[id] }));

  const allChecked = filtered.length > 0 && filtered.every(s => selected[s.id]);
  const toggleAll = () => {
    if (allChecked) {
      const copy = { ...selected };
      filtered.forEach(s => { copy[s.id] = false; });
      setSelected(copy);
    } else {
      const copy = { ...selected };
      filtered.forEach(s => { copy[s.id] = true; });
      setSelected(copy);
    }
  };

  const makeShareLink = () => {
    if (!selectedIds.length) return;
    // This would be produced by backend; we mock it:
    const url = `${location.origin}/employee?sc=${encodeURIComponent(selectedIds.join(","))}`;
    navigator.clipboard?.writeText(url);
    setFlash({ type: "ok", text: "Share link copied to clipboard." });
    setTimeout(() => setFlash(null), 1200);
  };

  const sendNow = async () => {
    if (!selectedIds.length) {
      setFlash({ type: "bad", text: "Select at least one scenario." });
      return;
    }
    const recips = recipients
      .split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

    if (!recips.length) {
      setFlash({ type: "bad", text: "Add at least one recipient email." });
      return;
    }

    const payload = {
      scenarioIds: selectedIds,
      recipients: recips,
      dueAt: dueAt || null,
      note: note || "",
    };

    setLoading(true);
    const res = await sendCampaignMock(payload);
    setLoading(false);

    if (res.ok) {
      setFlash({ type: "ok", text: "Campaign created and notified (mock)." });
      setSelected({});
      setNote("");
      setDueAt("");
      setRecipients("");
      setTimeout(() => setFlash(null), 1400);
    } else {
      setFlash({ type: "bad", text: "Failed to send (mock)." });
    }
  };

  return (
    <div className="admin-root">
      {/* topbar */}
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

          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>← Back to dashboard</button>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        <h1 className="page-title">View Scenarios</h1>
        <p className="page-subtitle">Pick ready scenarios and send them to employees.</p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}

        <div className="vs-grid">
          {/* LEFT: list */}
          <div className="panel">
            <div className="filters">
              <input
                className="input"
                placeholder="Search scenario or tag…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <select className="input" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                <option>All</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <div className="right-actions">
                <button className="btn-ghost" onClick={toggleAll}>
                  {allChecked ? "Clear selection" : "Select all"}
                </button>
                <span className="muted small">{selectedIds.length} selected</span>
              </div>
            </div>

            {loading ? (
              <div className="skeleton-panel" />
            ) : filtered.length === 0 ? (
              <div className="empty">No scenarios match your filters.</div>
            ) : (
              <div className="vs-table">
                <div className="vs-head">
                  <div className="c c1"></div>
                  <div className="c c2">Scenario</div>
                  <div className="c c3">Meta</div>
                  <div className="c c4">Updated</div>
                  <div className="c c5">Actions</div>
                </div>

                {filtered.map(s => (
                  <div className="vs-row" key={s.id}>
                    <div className="c c1">
                      <input
                        type="checkbox"
                        checked={!!selected[s.id]}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </div>
                    <div className="c c2">
                      <div className="title">{s.title}</div>
                      <div className="muted tiny">{s.tags.join(" • ")}</div>
                    </div>
                    <div className="c c3">
                      <span className="pill">{s.difficulty}</span>
                      <span className="muted tiny"> • {s.est}</span>
                      <div className="muted tiny">{s.sections} sections • {s.questions} questions • {s.maxScore} pts</div>
                    </div>
                    <div className="c c4">
                      <div className="muted tiny">{new Date(s.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="c c5">
                      <button className="btn-ghost" onClick={()=>setActive(s)}>Preview</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: send panel */}
          <div className="panel send-panel">
            <h3 className="panel-title">Send to employees</h3>
            <p className="muted small" style={{marginTop:-6}}>Choose who receives the selected scenario{selectedIds.length>1?"s":""}.</p>

            <div className="form-row">
              <label>Selected scenarios</label>
              <div className="chips">
                {selectedIds.length === 0
                  ? <span className="muted tiny">None selected</span>
                  : selectedIds.map(id => {
                      const s = scenarios.find(x=>x.id===id);
                      return <span key={id} className="chip">{s?.title ?? id}</span>;
                    })}
              </div>
            </div>

            <div className="form-row">
              <label>Recipients (emails)</label>
              <textarea
                className="input"
                rows={5}
                value={recipients}
                onChange={e=>setRecipients(e.target.value)}
                placeholder="alice@acme.com, bob@acme.com&#10;or one email per line"
              />
            </div>

            <div className="form-row two">
              <div>
                <label>Due date (optional)</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={dueAt}
                  onChange={e=>setDueAt(e.target.value)}
                />
              </div>
              <div>
                <label>&nbsp;</label>
                <button className="btn-ghost" onClick={makeShareLink} disabled={!selectedIds.length}>
                  Copy share link
                </button>
              </div>
            </div>

            <div className="form-row">
              <label>Message (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={note}
                onChange={e=>setNote(e.target.value)}
                placeholder="Short note that appears in the invite email"
              />
            </div>

            <div className="row-end">
              <button className="btn-outlined" onClick={()=>{ setSelected({}); setRecipients(""); setDueAt(""); setNote(""); }}>
                Clear
              </button>
              <button className="btn-primary" onClick={sendNow} disabled={loading}>
                Send now
              </button>
            </div>

            {/* Small preview card */}
            {active && (
              <>
                <div className="sep" />
                <h4 className="panel-title">Preview</h4>
                <div className="preview-card">
                  <div className="p-top">
                    <span className="p-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" width="20" height="20">
                        <rect x="3" y="3" width="18" height="18" rx="6" fill="#6b61ff" opacity=".18" />
                        <path d="M9 9h6v6H9z" stroke="#6b61ff" strokeWidth="1.6" fill="none" />
                      </svg>
                    </span>
                    <span className="pill">{active.difficulty}</span>
                  </div>
                  <h4 className="p-title">{active.title}</h4>
                  <p className="p-sub">{active.tags.join(", ")} • {active.est}</p>
                  <div className="p-meta">
                    <span>{active.sections} section{active.sections!==1?"s":""}</span>
                    <span>{active.questions} question{active.questions!==1?"s":""}</span>
                    <span>{active.maxScore} points</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}