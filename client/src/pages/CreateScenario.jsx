// src/pages/CreateScenario.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateScenario.css";

/* Mock Question Bank API — swap later with GET /api/question-bank?q=... */
async function fetchQuestionBank(query = "") {
  await new Promise((r) => setTimeout(r, 200)); // demo latency
  const bank = [
    {
      id: "q1",
      text: "What is your first action when detecting ransomware activity?",
      tags: ["Security", "IR"],
      options: [
        { id: "a", text: "Disconnect affected servers from the network.", score: 10, kind: "correct" },
        { id: "b", text: "Run antivirus across all systems immediately.", score: 2,  kind: "incorrect" }
      ]
    },
    {
      id: "q2",
      text: "When should management be informed?",
      tags: ["Security", "IR"],
      options: [
        { id: "a", text: "Immediately after detection to escalate response.", score: 10, kind: "correct" },
        { id: "b", text: "Only after resolution.", score: 2, kind: "incorrect" }
      ]
    }
  ];
  const q = query.trim().toLowerCase();
  return q ? bank.filter((x) => x.text.toLowerCase().includes(q)) : bank;
}

const RISK = ["Beginner", "Intermediate", "Advanced"];

export default function CreateScenario() {
  const navigate = useNavigate();

  // —— Meta ——
  const [meta, setMeta] = useState({
    title: "",
    risk: "Intermediate",
    description: "",
  });

  // —— Flat list of Questions (no sections) ——
  const [questions, setQuestions] = useState([
    {
      id: nid(),
      text: "",
      options: [
        { id: nid(), text: "", score: 10, kind: "correct" },
        { id: nid(), text: "", score: 2,  kind: "incorrect" },
      ],
    },
  ]);

  // —— Question Bank drawer state ——
const [bankOpen, setBankOpen] = useState(false);
const [bankLoading, setBankLoading] = useState(false);
const [bankQuery, setBankQuery] = useState("");
const [bankItems, setBankItems] = useState([]);
const [bankSelected, setBankSelected] = useState(null);
const [bankCompact, setBankCompact] = useState(true); // compact vs wrapped preview
  const openBank = async () => {
    setBankOpen(true);
    setBankLoading(true);
    const data = await fetchQuestionBank();
    setBankItems(data);
    setBankSelected(data[0] || null); // ensure a selection exists
    setBankLoading(false);
  };

  const searchBank = async (q) => {
    setBankQuery(q);
    setBankLoading(true);
    const data = await fetchQuestionBank(q);
    setBankItems(data);
    // keep selection if still present, else pick first
    setBankSelected((prev) => data.find(d => d.id === prev?.id) || data[0] || null);
    setBankLoading(false);
  };

  // Add selected bank question as a COPY (safe for future versioning)
  const addFromBankAsCopy = () => {
    if (!bankSelected) return;

    const copyOpt = (o) => ({ ...o, id: nid() });
    const qCopy = {
      id: nid(),
      text: bankSelected.text,
      options: (bankSelected.options || []).map(copyOpt),
      source: { type: "bank", refId: bankSelected.id }, // helpful for backend
    };

    setQuestions((qs) => [...qs, qCopy]);

    setBankOpen(false);
    setBankSelected(null);
    setBankQuery("");
  };

  // —— Validation ——
  const issues = useMemo(() => validate(meta, questions), [meta, questions]);

  // Questions CRUD
  const addQuestion = () => {
    setQuestions((q) => [
      ...q,
      {
        id: nid(),
        text: "",
        options: [
          { id: nid(), text: "", score: 10, kind: "correct" },
          { id: nid(), text: "", score: 2,  kind: "incorrect" },
        ],
      },
    ]);
  };

  const removeQuestion = (qid) => {
    setQuestions((q) => q.filter((x) => x.id !== qid));
  };

  const updateQuestion = (qid, patch) => {
    setQuestions((q) => q.map((x) => (x.id === qid ? { ...x, ...patch } : x)));
  };

  // Options CRUD
  const addOption = (qid) => {
    setQuestions((q) =>
      q.map((x) =>
        x.id === qid
          ? { ...x, options: [...x.options, { id: nid(), text: "", score: 0, kind: "incorrect" }] }
          : x
      )
    );
  };

  const removeOption = (qid, oid) => {
    setQuestions((q) =>
      q.map((x) =>
        x.id === qid ? { ...x, options: x.options.filter((o) => o.id !== oid) } : x
      )
    );
  };

  // Options: edit (allow multiple correct answers; no exclusivity)
  const updateOption = (qid, oid, patch) => {
    setQuestions(q =>
      q.map(x => {
        if (x.id !== qid) return x;
        return {
          ...x,
          options: x.options.map(o => {
            if (o.id !== oid) return o;
            const bump =
              patch.kind === "correct" && patch.score == null
                ? { score: Math.max(10, Number(o.score) || 10) }
                : {};
            return { ...o, ...patch, ...bump };
          }),
        };
      })
    );
  };

  // Quick toggle correct on/off for a single option (still no exclusivity)
  const markCorrect = (qid, oid) => {
    setQuestions(q =>
      q.map(x =>
        x.id !== qid
          ? x
          : {
              ...x,
              options: x.options.map(o =>
                o.id !== oid
                  ? o
                  : o.kind === "correct"
                  ? { ...o, kind: "incorrect" }
                  : { ...o, kind: "correct", score: Math.max(10, o.score || 10) }
              ),
            }
      )
    );
  };

  // —— Payload (preview + save) ——
  const payload = useMemo(() => {
    const maxScore = questions.reduce(
      (sum, q) => sum + Math.max(0, ...q.options.map((o) => Number(o.score) || 0)),
      0
    );

    return {
      title: meta.title.trim(),
      risk: meta.risk,
      description: meta.description.trim(),
      questions,
      maxScore,
    };
  }, [meta, questions]);

  const [flash, setFlash] = useState(null);

  const save = async () => {
    if (issues.length) return;
    // TODO: POST /api/scenarios
    console.log("CREATE_SCENARIO_PAYLOAD", payload);
    setFlash({ type: "ok", text: "Scenario saved!" });
    setTimeout(() => navigate("/admin"), 600);
  };

  return (
    <div className="admin-root">
      {/* — Topbar — */}
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
            <button
              className="btn-primary"
              onClick={save}
              disabled={issues.length > 0}
              title={issues.join("\n")}
            >
              Save scenario
            </button>
          </div>
        </div>
      </div>

      {/* — Content — */}
      <div className="container create-wrap">
        <h1 className="page-title">Create Scenario</h1>
        <p className="page-subtitle">Define metadata, questions and scoring.</p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}

        <div className="grid-two">
          {/* LEFT: form */}
          <div className="panel">
            <h3 className="panel-title">Scenario details</h3>

            <div className="form-row">
              <label>Title</label>
              <input
                className="input"
                value={meta.title}
                onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                placeholder="e.g., Ransomware Detected"
              />
            </div>

            <div className="form-row">
              <label>Risk</label>
              <select
                className="input"
                value={meta.risk}
                onChange={(e) => setMeta((m) => ({ ...m, risk: e.target.value }))}
              >
                {RISK.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Description</label>
              <textarea
                className="input"
                rows={3}
                value={meta.description}
                onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
                placeholder="Write a short description of the scenario…"
              />
            </div>

            <div className="sep" />

            {/* Questions */}
            <div
              className="questions-head"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <h3 className="panel-title">Questions</h3>
              <div className="row gap">
                <button className="btn-ghost" onClick={addQuestion}>
                  + Add question
                </button>
                <button className="btn-ghost" onClick={openBank}>
                  + Add from bank
                </button>
              </div>
            </div>

            {questions.map((q, qi) => (
              <div className="q-card" key={q.id}>
                <div className="q-head">
                  <b>Q{qi + 1}</b>
                  <button className="btn-ghost danger" onClick={() => removeQuestion(q.id)}>
                    Remove question
                  </button>
                </div>

                <div className="form-row">
                  <label>Question text</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder="Write the question…"
                  />
                </div>

                {/* Options */}
                <div className="opts">
                  <div className="opts-head">
                    <h4>Options</h4>
                    <button className="btn-ghost" onClick={() => addOption(q.id)}>
                      + Add option
                    </button>
                  </div>

                  {q.options.map((o, oi) => (
                    <div className={`opt-row status-${o.kind}`} key={o.id}>
                      <button
                        type="button"
                        className={`opt-check ${o.kind}`}
                        onClick={() => markCorrect(q.id, o.id)}
                        title={o.kind === "correct" ? "This is the correct answer" : "Mark as correct"}
                        aria-label={o.kind === "correct" ? "Correct answer" : "Mark option as correct"}
                      >
                        {o.kind === "correct" ? "✓" : o.kind === "partial" ? "~" : "×"}
                      </button>

                      <input
                        className="input"
                        value={o.text}
                        onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                        placeholder={`Option ${oi + 1} text`}
                      />

                      <input
                        className="input score"
                        type="number"
                        min="0"
                        step="1"
                        value={o.score}
                        onChange={(e) => updateOption(q.id, o.id, { score: Number(e.target.value) })}
                        title="Score"
                      />

                      <select
                        className="input kind"
                        value={o.kind}
                        onChange={(e) => updateOption(q.id, o.id, { kind: e.target.value })}
                        title="Kind"
                      >
                        <option value="correct">correct</option>
                        <option value="partial">partial</option>
                        <option value="incorrect">incorrect</option>
                        <option value="none">none</option>
                      </select>

                      <button
                        className="btn-ghost danger"
                        onClick={() => removeOption(q.id, o.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {issues.length > 0 && (
              <div className="issues">
                <b>Fix before saving:</b>
                <ul>{issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
          </div>

          {/* RIGHT: live preview */}
          <div className="panel preview">
            <h3 className="panel-title">Preview</h3>

            <div className="preview-card">
              <div className="p-top">
                <span className="p-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <rect x="3" y="3" width="18" height="18" rx="6" fill="#6b61ff" opacity=".18" />
                    <path d="M9 9h6v6H9z" stroke="#6b61ff" strokeWidth="1.6" fill="none" />
                  </svg>
                </span>
                <span className="pill">{meta.risk}</span>
              </div>

              <h4 className="p-title">{meta.title || "Untitled scenario"}</h4>
              {meta.description ? (
                <p className="p-sub">{meta.description}</p>
              ) : (
                <p className="p-sub">Describe the scenario…</p>
              )}

              <div className="p-meta">
                <span>
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </span>
                <span>{payload.maxScore} max points</span>
              </div>

              <button className="btn-gradient purple" disabled>
                Generate preview (mock)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Question Bank Drawer ===== */}
      {bankOpen && (
        <div className="drawer" role="dialog" aria-modal="true">
          <div className="drawer-backdrop" onClick={() => setBankOpen(false)} />
          <div className="drawer-panel">
            <div className="drawer-head">
              <b>Select from question bank</b>
              <button className="btn-ghost" onClick={() => setBankOpen(false)}>Close</button>
            </div>

            {/* Single-column bank body */}
            <div className="panel bank-body">
              {/* Top: search */}
              <input
                className="input"
                placeholder="Search question text…"
                value={bankQuery}
                onChange={(e) => searchBank(e.target.value)}
              />

              {/* Controls: dropdown + compact/wrap toggles */}
              <div className="bank-controls">
                <select
                  className="input bank-select"
                  value={bankSelected?.id || ""}
                  onChange={(e) => {
                    const picked = bankItems.find(x => x.id === e.target.value);
                    setBankSelected(picked || null);
                  }}
                >
                  <option value="" disabled>{bankLoading ? "Loading…" : "Choose a question…"}</option>
                  {bankItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
                </select>

                <div className="toggle-wrap">
                  <button
                    type="button"
                    className={`btn-ghost ${bankCompact ? "is-active" : ""}`}
                    onClick={() => setBankCompact(true)}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${!bankCompact ? "is-active" : ""}`}
                    onClick={() => setBankCompact(false)}
                  >
                    Wrap
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className={`preview-card ${bankCompact ? "is-compact" : "is-wrapped"}`} style={{ marginTop: 6 }}>
                <h3 className="q-title">{bankSelected?.text || "Select a question above"}</h3>

                {bankSelected && (
                  <>
                    <div className="opts-title">Options</div>

                    {(bankSelected.options || []).map(o => (
                      <div key={o.id} className={`opt-row status-${o.kind}`}>
                        <div className={`opt-check ${o.kind}`} aria-hidden>
                          {o.kind === "correct" ? "✓" : o.kind === "partial" ? "~" : "×"}
                        </div>

                        <div className="opt-text">{o.text}</div>
                        <div className="pill pill-score">{o.score}</div>
                        <div className={`pill pill-verdict ${o.kind}`}>{o.kind}</div>
                      </div>
                    ))}

                    <div className="drawer-actions" style={{ justifyContent: "flex-start", gap: 10 }}>
                      <button className="btn-primary" onClick={addFromBankAsCopy}>Add as copy</button>
                      <button className="btn-ghost" disabled title="Linking can be added later">Link (later)</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* utils */
function nid() {
  return Math.random().toString(36).slice(2, 9);
}

function validate(meta, questions) {
  const out = [];
  if (!meta.title.trim()) out.push("Title is required.");
  if (!questions.length) out.push("Add at least one question.");

  questions.forEach((q, qi) => {
    if (!q.text.trim()) out.push(`Q${qi + 1}: question text is required.`);
    if (!q.options.length) out.push(`Q${qi + 1}: add at least one option.`);
    const hasCorrect = q.options.some((o) => o.kind === "correct");
    if (!hasCorrect) out.push(`Q${qi + 1}: mark one option as correct.`);
  });

  return out;
}