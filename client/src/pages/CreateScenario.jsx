// src/pages/CreateScenario.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreateScenario.css";

/* ===== Chip-style searchable multi-select for roles ===== */
function RolePicker({ options = [], value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  const items = useMemo(
    () =>
      options
        .map((role) => ({
          id: String(role?.id ?? role?.Id ?? ""),
          name: role?.name ?? role?.Name ?? "",
        }))
        .filter((role) => role.id && role.name),
    [options]
  );

  const selected = useMemo(() => new Set((value ?? []).map(String)), [value]);

  const chips = useMemo(() => {
    const map = new Map(items.map((item) => [item.id, item.name]));
    return Array.from(selected)
      .map((id) => {
        const name = map.get(id);
        return name ? { id, name } : null;
      })
      .filter(Boolean);
  }, [items, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((role) => role.name.toLowerCase().includes(q));
  }, [items, query]);

  const toggle = (roleId) => {
    const next = new Set(selected);
    if (next.has(roleId)) {
      next.delete(roleId);
    } else {
      next.add(roleId);
    }
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);

  return (
    <div className={`rolepicker${disabled ? " is-disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="rp-field"
        onClick={() => !disabled && setOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <div className="rp-chips">
          {chips.length === 0 ? (
            <span className="chip chip-all">All roles</span>
          ) : (
            chips.map((chip) => (
              <span key={chip.id} className="chip">
                {chip.name}
                <button
                  type="button"
                  className="chip-x"
                  aria-label={`Remove ${chip.name}`}
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(chip.id);
                  }}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <span className="rp-caret" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="rp-pop" role="listbox">
          <div className="rp-search">
            <input
              className="input"
              placeholder="Search roles…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <button className="btn-ghost rp-clear" onClick={clearAll} title="Everyone">
              All
            </button>
          </div>

          <div className="rp-list">
            {filtered.length === 0 && <div className="rp-empty">No roles match.</div>}
            {filtered.map((role) => {
              const picked = selected.has(role.id);
              return (
                <button
                  type="button"
                  key={role.id}
                  className={`rp-item ${picked ? "is-picked" : ""}`}
                  onClick={() => toggle(role.id)}
                >
                  <span className={`rp-check ${picked ? "on" : ""}`} aria-hidden>
                    {picked ? "✓" : ""}
                  </span>
                  <span className="rp-txt">{role.name}</span>
                </button>
              );
            })}
          </div>

          <div className="rp-help">
            Empty = everyone. If you pick roles, the question is visible only to those roles.
          </div>
        </div>
      )}
    </div>
  );
}

const RISK = ["Beginner", "Intermediate", "Advanced"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

const mapRiskValue = (value) => {
  const lookup = {
    Beginner: "Low",
    Intermediate: "Medium",
    Advanced: "High",
    Low: "Low",
    Medium: "Medium",
    High: "High",
    Extreme: "Extreme",
  };
  const normalized = typeof value === "string" && value.length
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : "";
  return lookup[normalized] ?? lookup[value] ?? "Medium";
};

const normalisePriority = (value) => {
  if (typeof value === "string" && value.length) {
    const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    if (PRIORITY_OPTIONS.includes(normalized)) return normalized;
  }
  return "Medium";
};

export default function CreateScenario() {
  const navigate = useNavigate();

  // —— Meta ——
  const [meta, setMeta] = useState({
    title: "",
    risk: "Intermediate",
    description: "",
  });

  // —— Questions (flat) ——
  const [questions, setQuestions] = useState([
    {
      id: nid(),
      text: "",
      priority: "Medium",
      roleIds: [],
      options: [
        { id: nid(), text: "", score: 10, kind: "correct" },
        { id: nid(), text: "", score: 2, kind: "incorrect" },
      ],
    },
  ]);

  // —— Question Bank drawer ——
  const [bankOpen, setBankOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankItems, setBankItems] = useState([]);
  const [bankSelected, setBankSelected] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadRoles() {
      try {
        const { data } = await api.get("/api/roles");
        if (!active) return;
        const items = Array.isArray(data)
          ? data
              .map((role) => ({
                id: role.id ?? role.Id ?? role.name ?? role.Name ?? nid(),
                name: role.name ?? role.Name ?? "Unnamed role",
              }))
              .filter((role) => role.name)
          : [];
        setRoles(items);
      } catch (err) {
        console.error("Failed to load roles", err);
        setRoles([]);
      }
    }

    loadRoles();
    return () => {
      active = false;
    };
  }, []);

  const roleNameById = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => {
      map.set(String(role.id), role.name);
    });
    return map;
  }, [roles]);

  const loadQuestionBank = async (query = "") => {
    setBankLoading(true);
    try {
      const response = await api.get("/api/question", {
        params: query ? { search: query } : undefined,
      });

      const items = Array.isArray(response.data)
        ? response.data
            .map((raw) => {
              const text = raw?.text ?? raw?.Text ?? "Untitled question";
              if (!text.trim()) return null;

              const rawRoles = Array.isArray(raw?.questionRoles ?? raw?.QuestionRoles)
                ? raw.questionRoles ?? raw.QuestionRoles
                : [];

              const roleIds = rawRoles
                .map((qr) =>
                  qr?.roleId ??
                  qr?.RoleId ??
                  qr?.role?.id ??
                  qr?.role?.Id ??
                  qr?.Role?.id ??
                  qr?.Role?.Id ??
                  null
                )
                .filter(Boolean)
                .map((id) => String(id));

              const roleNames = roleIds
                .map((id) => roleNameById.get(id))
                .filter(Boolean);

              const options = Array.isArray(raw?.answerOptions ?? raw?.AnswerOptions)
                ? (raw.answerOptions ?? raw.AnswerOptions).map((option) => {
                    const isCorrect = Boolean(
                      option?.isCorrect ?? option?.IsCorrect ?? option?.kind === "correct"
                    );
                    const weight = Number(
                      option?.weight ?? option?.Weight ?? option?.score ?? option?.Score ?? 0
                    );
                    return {
                      id: option?.id ?? option?.Id ?? nid(),
                      text: option?.text ?? option?.Text ?? "",
                      score: Number.isFinite(weight) ? weight : 0,
                      kind: isCorrect ? "correct" : "incorrect",
                    };
                  })
                : [];

              return {
                id: String(raw?.id ?? raw?.Id ?? nid()),
                text,
                priority: normalisePriority(raw?.priority ?? raw?.Priority),
                roleIds,
                roleNames,
                options,
              };
            })
            .filter(Boolean)
        : [];

      setBankItems(items);
      setBankSelected((prev) => {
        if (!prev) return items[0] || null;
        return items.find((item) => item.id === prev.id) || items[0] || null;
      });
    } catch (err) {
      console.error("Failed to load question bank", err);
      setBankItems([]);
      setBankSelected(null);
    } finally {
      setBankLoading(false);
    }
  };

  const openBank = async () => {
    setBankOpen(true);
    setBankQuery("");
    await loadQuestionBank();
  };

  const searchBank = async (query) => {
    setBankQuery(query);
    await loadQuestionBank(query);
  };

  const addFromBankAsCopy = () => {
    if (!bankSelected) return;
    const copyOpt = (o) => ({
      id: nid(),
      text: o.text ?? "",
      score: Number.isFinite(o.score) ? o.score : o.kind === "correct" ? 10 : 0,
      kind: o.kind ?? (o.score > 0 ? "correct" : "incorrect"),
    });
    const qCopy = {
      id: nid(),
      text: bankSelected.text,
      priority: bankSelected.priority ?? "Medium",
      roleIds: Array.isArray(bankSelected.roleIds) ? [...bankSelected.roleIds] : [],
      options: (bankSelected.options || []).map(copyOpt),
      source: { type: "bank", refId: bankSelected.id },
    };
    setQuestions((qs) => [...qs, qCopy]);
    setBankOpen(false);
    setBankSelected(null);
    setBankQuery("");
  };

  // —— Validation ——
  const issues = useMemo(() => validate(meta, questions), [meta, questions]);

  // —— Questions CRUD ——
  const addQuestion = () => {
    setQuestions((q) => [
      ...q,
      {
        id: nid(),
        text: "",
        priority: "Medium",
        roleIds: [],
        options: [
          { id: nid(), text: "", score: 10, kind: "correct" },
          { id: nid(), text: "", score: 2, kind: "incorrect" },
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

  // —— Options CRUD ——
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
      q.map((x) => (x.id === qid ? { ...x, options: x.options.filter((o) => o.id !== oid) } : x))
    );
  };

  // Allow multiple correct answers (no exclusivity)
  const updateOption = (qid, oid, patch) => {
    setQuestions((q) =>
      q.map((x) => {
        if (x.id !== qid) return x;
        return {
          ...x,
          options: x.options.map((o) => {
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

  // Toggle this option’s correctness
  const markCorrect = (qid, oid) => {
    setQuestions((q) =>
      q.map((x) =>
        x.id !== qid
          ? x
          : {
              ...x,
              options: x.options.map((o) =>
                o.id !== oid
                  ? o
                  : o.kind === "correct"
                  ? { ...o, kind: "incorrect" } // turn off
                  : { ...o, kind: "correct", score: Math.max(10, o.score || 10) } // turn on
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
  const [savingScenario, setSavingScenario] = useState(false);

  const save = async () => {
    if (issues.length) return;
    const scenarioDto = {
      title: payload.title,
      description: payload.description,
      createdAt: new Date().toISOString(),
      risk: mapRiskValue(meta.risk),
      questions: payload.questions.map((q) => {
        const answerOptions = (q.options ?? [])
          .map((option) => ({
            text: option.text?.trim() ?? "",
            weight: Number.isFinite(Number(option.score)) ? Number(option.score) : 0,
            isCorrect: option.kind === "correct",
          }))
          .filter((option) => option.text.length > 0);

        return {
          text: q.text.trim(),
          priority: normalisePriority(q.priority),
          answerOptions,
          questionRoles: (q.roleIds ?? [])
            .filter(Boolean)
            .map((roleId) => ({ roleId })),
        };
      }),
    };

    setSavingScenario(true);
    try {
      const response = await api.post("/api/scenarios", scenarioDto);
      const scenarioId = response?.data;
      setFlash({ type: "ok", text: "Scenario created!" });
      setTimeout(() => {
        if (scenarioId) {
          navigate(`/admin/scenario/${scenarioId}`);
        } else {
          navigate("/admin/scenarios");
        }
      }, 600);
    } catch (err) {
      console.error("Failed to create scenario", err);
      setFlash({ type: "err", text: "Failed to create scenario. Please try again." });
    } finally {
      setSavingScenario(false);
    }
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
              disabled={issues.length > 0 || savingScenario}
              title={issues.join("\n")}
            >
              {savingScenario ? "Saving…" : "Save scenario"}
            </button>
          </div>
        </div>
      </div>

      {/* — Content — */}
      <div className="container create-wrap">
        <h1 className="page-title">Create Scenario</h1>
        <p className="page-subtitle">Define metadata, target audience, questions and scoring.</p>

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

                <div className="form-row">
                  <label>Priority</label>
                  <select
                    className="input"
                    value={q.priority ?? "Medium"}
                    onChange={(e) => updateQuestion(q.id, { priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audience (roles) */}
                <div className="form-row">
                  <label>Audience (roles)</label>
                  <RolePicker
                    options={roles}
                    value={q.roleIds || []}
                    onChange={(roleIds) => updateQuestion(q.id, { roleIds })}
                    disabled={roles.length === 0}
                  />
                  {roles.length === 0 && (
                    <div className="muted tiny">Roles not loaded yet – defaulting to everyone.</div>
                  )}
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
                        title={o.kind === "correct" ? "This is a correct answer (toggle)" : "Mark as correct"}
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

                      <button className="btn-ghost danger" onClick={() => removeOption(q.id, o.id)} type="button">
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
              <button className="btn-ghost" onClick={() => setBankOpen(false)}>
                Close
              </button>
            </div>

            {/* Single-column bank body */}
            <div className="panel bank-body">
              {/* Search */}
              <input
                className="input"
                placeholder="Search question text…"
                value={bankQuery}
                onChange={(e) => searchBank(e.target.value)}
              />

              {/* Dropdown */}
              <div className="bank-controls">
                <select
                  className="input bank-select"
                  value={bankSelected?.id || ""}
                  onChange={(e) => {
                    const picked = bankItems.find((x) => x.id === e.target.value);
                    setBankSelected(picked || null);
                  }}
                >
                  <option value="" disabled>
                    {bankLoading ? "Loading…" : "Choose a question…"}
                  </option>
                  {bankItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="preview-card is-wrapped" style={{ marginTop: 6 }}>
                <h3 className="q-title">{bankSelected?.text || "Select a question above"}</h3>

                {bankSelected && (
                  <>
                    <div className="muted tiny" style={{ marginBottom: 6 }}>
                      Roles: {bankSelected.roleNames?.length ? bankSelected.roleNames.join(", ") : "All"}
                    </div>
                    <div className="opts-title">Options</div>

                    {(bankSelected.options || []).map((o) => (
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
                      <button className="btn-primary" onClick={addFromBankAsCopy}>
                        Add as copy
                      </button>
                      <button className="btn-ghost" disabled title="Linking can be added later">
                        Link (later)
                      </button>
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