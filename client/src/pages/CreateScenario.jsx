import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateScenario.css";

const RISK = ["Beginner", "Intermediate", "Advanced"];

export default function CreateScenario() {
  const navigate = useNavigate();

  // base form state (no estimate)
  const [meta, setMeta] = useState({
    title: "",
    risk: "Intermediate",
    description: "",
  });

  // sections -> questions -> options
  const [sections, setSections] = useState([
    {
      id: nid(),
      title: "Triage & Containment",
      questions: [
        {
          id: nid(),
          text: "",
          hint: "",
          options: [
            { id: nid(), text: "", score: 10, kind: "correct" },
            { id: nid(), text: "", score: 2,  kind: "incorrect" },
          ],
        },
      ],
    },
  ]);

  // validation banners
  const issues = useMemo(() => validate(meta, sections), [meta, sections]);

  const addSection = () => {
    setSections(s => [
      ...s,
      { id: nid(), title: `Section ${s.length + 1}`, questions: [] },
    ]);
  };

  const removeSection = (sid) => {
    setSections(s => s.filter(x => x.id !== sid));
  };

  const updateSection = (sid, patch) => {
    setSections(s => s.map(sec => (sec.id === sid ? { ...sec, ...patch } : sec)));
  };

  const addQuestion = (sid) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: [
            ...sec.questions,
            {
              id: nid(),
              text: "",
              hint: "",
              options: [
                { id: nid(), text: "", score: 10, kind: "correct" },
                { id: nid(), text: "", score: 2,  kind: "incorrect" },
              ],
            },
          ],
        };
      })
    );
  };

  const removeQuestion = (sid, qid) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return { ...sec, questions: sec.questions.filter(q => q.id !== qid) };
      })
    );
  };

  const updateQuestion = (sid, qid, patch) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: sec.questions.map(q => (q.id === qid ? { ...q, ...patch } : q)),
        };
      })
    );
  };

  const addOption = (sid, qid) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: sec.questions.map(q => {
            if (q.id !== qid) return q;
            return {
              ...q,
              options: [...q.options, { id: nid(), text: "", score: 0, kind: "incorrect" }],
            };
          }),
        };
      })
    );
  };

  const removeOption = (sid, qid, oid) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: sec.questions.map(q => {
            if (q.id !== qid) return q;
            return { ...q, options: q.options.filter(o => o.id !== oid) };
          }),
        };
      })
    );
  };

  // If Kind is changed to "correct", make it the sole correct for that question.
  const updateOption = (sid, qid, oid, patch) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: sec.questions.map(q => {
            if (q.id !== qid) return q;

            if (patch.kind === "correct") {
              return {
                ...q,
                options: q.options.map(o =>
                  o.id === oid
                    ? { ...o, ...patch, score: Math.max(10, Number(patch.score ?? o.score) || 10) }
                    : { ...o, kind: o.kind === "correct" ? "incorrect" : o.kind }
                ),
              };
            }

            return {
              ...q,
              options: q.options.map(o => (o.id === oid ? { ...o, ...patch } : o)),
            };
          }),
        };
      })
    );
  };

  // Quick button to mark one as correct
  const markCorrect = (sid, qid, oid) => {
    setSections(s =>
      s.map(sec => {
        if (sec.id !== sid) return sec;
        return {
          ...sec,
          questions: sec.questions.map(q => {
            if (q.id !== qid) return q;
            return {
              ...q,
              options: q.options.map(o =>
                o.id === oid
                  ? { ...o, kind: "correct", score: Math.max(10, o.score) }
                  : { ...o, kind: o.kind === "correct" ? "incorrect" : o.kind }
              ),
            };
          }),
        };
      })
    );
  };

  const payload = useMemo(() => {
    const description = meta.description.trim();


    // compute max score (highest option per question)
    const maxScore = sections.reduce(
      (sum, sec) =>
        sum +
        sec.questions.reduce((ss, q) => {
          const best = Math.max(0, ...q.options.map(o => Number(o.score) || 0));
          return ss + best;
        }, 0),
      0
    );

    return {
      title: meta.title.trim(),
      risk: meta.risk,
      description,
      sections,
      maxScore,
    };
  }, [meta, sections]);

  const [flash, setFlash] = useState(null);

  const save = async () => {
    if (issues.length) return;
    // TODO: swap with real POST /api/scenarios
    console.log("CREATE_SCENARIO_PAYLOAD", payload);
    setFlash({ type: "ok", text: "Scenario saved!" });
    setTimeout(() => navigate("/admin"), 600);
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

      {/* content */}
      <div className="container create-wrap">
        <h1 className="page-title">Create Scenario</h1>
        <p className="page-subtitle">Define metadata, sections, questions and scoring.</p>

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
                onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                placeholder="e.g., Ransomware Detected"
              />
            </div>

            {/* Risk — full width */}
            <div className="form-row">
              <label>Risk</label>
              <select
                className="input"
                value={meta.risk}
                onChange={e => setMeta(m => ({ ...m, risk: e.target.value }))}
              >
                {RISK.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
  <label>Description <span className="muted"></span></label>
  <textarea
    className="input"
    rows={3}
    value={meta.description}
    onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
    placeholder="Write a short description of the scenario..."
  />
</div>

            <div className="sep" />

            <div className="sections-head">
              <h3 className="panel-title">Sections & questions</h3>
              <button className="btn-ghost" onClick={addSection}>
                + Add section
              </button>
            </div>

            {sections.map((sec, si) => (
              <div className="section-card" key={sec.id}>
                <div className="section-head">
                  <input
                    className="input section-title"
                    value={sec.title}
                    onChange={e => updateSection(sec.id, { title: e.target.value })}
                    placeholder={`Section ${si + 1} title`}
                  />
                  <div className="row gap">
                    <button className="btn-ghost" onClick={() => addQuestion(sec.id)}>
                      + Question
                    </button>
                    <button
                      className="btn-ghost danger"
                      onClick={() => removeSection(sec.id)}
                      disabled={sections.length === 1}
                    >
                      Delete section
                    </button>
                  </div>
                </div>

                {sec.questions.map((q, qi) => (
                  <div className="q-card" key={q.id}>
                    <div className="q-head">
                      <b>Q{qi + 1}</b>
                      <button
                        className="btn-ghost danger"
                        onClick={() => removeQuestion(sec.id, q.id)}
                      >
                        Remove question
                      </button>
                    </div>

                    <div className="form-row">
                      <label>Question text</label>
                      <textarea
                        className="input"
                        rows={2}
                        value={q.text}
                        onChange={e => updateQuestion(sec.id, q.id, { text: e.target.value })}
                        placeholder="Write the question…"
                      />
                    </div>

                    <div className="form-row">
                      <label>
                        Hint <span className="muted">(optional)</span>
                      </label>
                      <input
                        className="input"
                        value={q.hint || ""}
                        onChange={e => updateQuestion(sec.id, q.id, { hint: e.target.value })}
                        placeholder="Helpful hint"
                      />
                    </div>

                    <div className="opts">
                      <div className="opts-head">
                        <h4>Options</h4>
                        <button className="btn-ghost" onClick={() => addOption(sec.id, q.id)}>
                          + Add option
                        </button>
                      </div>

                      {q.options.map((o, oi) => (
                        <div className={`opt-row status-${o.kind}`} key={o.id}>
                          <button
                            type="button"
                            className={`opt-check ${o.kind}`}
                            onClick={() => markCorrect(sec.id, q.id, o.id)}
                            title={
                              o.kind === "correct"
                                ? "This is the correct answer"
                                : "Mark as correct"
                            }
                            aria-label={
                              o.kind === "correct"
                                ? "Correct answer"
                                : "Mark option as correct"
                            }
                          >
                            {o.kind === "correct" ? "✓" : o.kind === "partial" ? "~" : "×"}
                          </button>

                          <input
                            className="input"
                            value={o.text}
                            onChange={e => updateOption(sec.id, q.id, o.id, { text: e.target.value })}
                            placeholder={`Option ${oi + 1} text`}
                          />

                          <input
                            className="input score"
                            type="number"
                            min="0"
                            step="1"
                            value={o.score}
                            onChange={e =>
                              updateOption(sec.id, q.id, o.id, { score: Number(e.target.value) })
                            }
                            title="Score"
                          />

                          <select
                            className="input kind"
                            value={o.kind}
                            onChange={e => updateOption(sec.id, q.id, o.id, { kind: e.target.value })}
                            title="Kind"
                          >
                            <option value="correct">correct</option>
                            <option value="partial">partial</option>
                            <option value="incorrect">incorrect</option>
                            <option value="none">none</option>
                          </select>

                          <button
                            className="btn-ghost danger"
                            onClick={() => removeOption(sec.id, q.id, o.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              {meta.tags ? (
                <p className="p-sub">{meta.tags}</p>
              ) : (
                <p className="p-sub">Tags…</p>
              )}

              <div className="p-meta">
                <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
                <span>
                  {sections.reduce((n, s) => n + s.questions.length, 0)} question
                  {sections.reduce((n, s) => n + s.questions.length, 0) !== 1 ? "s" : ""}
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
    </div>
  );
}

/* utils */
function nid() {
  return Math.random().toString(36).slice(2, 9);
}

function validate(meta, sections) {
  const out = [];
  if (!meta.title.trim()) out.push("Title is required.");
  if (!sections.length) out.push("Add at least one section.");
  sections.forEach((s, si) => {
    if (!s.title.trim()) out.push(`Section ${si + 1}: title is required.`);
    if (!s.questions.length) out.push(`Section ${si + 1}: add at least one question.`);
    s.questions.forEach((q, qi) => {
      if (!q.text.trim()) out.push(`Q${qi + 1} in section ${si + 1}: question text is required.`);
      if (!q.options.length) out.push(`Q${qi + 1} in section ${si + 1}: add at least one option.`);
      const hasCorrect = q.options.some(o => o.kind === "correct");
      if (!hasCorrect) out.push(`Q${qi + 1} in section ${si + 1}: mark one option as correct.`);
    });
  });
  return out;
}