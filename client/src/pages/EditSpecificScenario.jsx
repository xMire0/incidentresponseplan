// src/pages/EditSpecificScenario.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import "./EditSpecificScenario.css";

const RISK_OPTIONS = ["Low", "Medium", "High", "Extreme"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

function nid() {
  return Math.random().toString(36).slice(2, 10);
}

function isTempId(value) {
  return typeof value === "string" && value.startsWith("tmp-");
}

function ensureId(value, prefix) {
  if (value) return value;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normaliseScenario(raw) {
  if (!raw) return null;

  const questions = Array.isArray(raw.questions ?? raw.Questions)
    ? (raw.questions ?? raw.Questions).map((q) => {
        const roleIds = Array.isArray(q.questionRoles ?? q.QuestionRoles)
          ? (q.questionRoles ?? q.QuestionRoles)
              .map(
                (qr) =>
                  qr.roleId ??
                  qr.RoleId ??
                  qr.role?.id ??
                  qr.Role?.Id ??
                  qr.role?.Id ??
                  qr.Role?.id
              )
              .filter(Boolean)
          : [];

        const options = Array.isArray(q.answerOptions ?? q.AnswerOptions)
          ? (q.answerOptions ?? q.AnswerOptions).map((o) => ({
              id: ensureId(o.id ?? o.Id, "option"),
              text: o.text ?? o.Text ?? "",
              isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
              weight: o.weight ?? o.Weight ?? 0,
              status: "existing",
            }))
          : [];

        return {
          id: ensureId(q.id ?? q.Id, "question"),
          text: q.text ?? q.Text ?? "Untitled question",
          priority: normalisePriority(q.priority ?? q.Priority),
          roleIds: Array.from(new Set(roleIds.map(String))),
          options,
          dirty: false,
          status: "existing",
        };
      })
    : [];

  return {
    id: raw.id ?? raw.Id ?? "",
    title: raw.title ?? raw.Title ?? "Untitled scenario",
    description: raw.description ?? raw.Description ?? "",
    risk: raw.risk ?? raw.Risk ?? "Low",
    createdAt: raw.createdAt ?? raw.CreatedAt ?? null,
    questions,
  };
}

function normalisePriority(value) {
  if (typeof value === "string" && value.length > 0) {
    const normalized = value.charAt(0).toUpperCase() + value.slice(1);
    return PRIORITY_OPTIONS.includes(normalized) ? normalized : value;
  }
  const lookup = {
    0: "Low",
    1: "Medium",
    2: "High",
    3: "Urgent",
  };
  return lookup[value] ?? "Low";
}

function RolePicker({ options, value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const items = useMemo(
    () =>
      options
        .map((role) => ({
          id: role.id ?? role.Id,
          name: role.name ?? role.Name ?? "Unnamed role",
        }))
        .filter((role) => role.id),
    [options]
  );

  const selected = useMemo(() => new Set((value ?? []).filter(Boolean)), [value]);

  const chips = useMemo(() => {
    const map = new Map(items.map((role) => [role.id, role.name]));
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

  useEffect(() => {
    const handler = (event) => {
      if (!open) return;
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const toggle = (roleId) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(roleId)) {
      next.delete(roleId);
    } else {
      next.add(roleId);
    }
    onChange(Array.from(next));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
    setOpen(false);
  };

  return (
    <div className={`rolepicker${disabled ? " is-disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="rp-field"
        onClick={() => !disabled && setOpen((prev) => !prev)}
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
            <button className="btn-ghost rp-clear" onClick={clearAll}>
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
            Empty = everyone. Select roles to limit visibility for this question.
          </div>
        </div>
      )}
    </div>
  );
}

function createOptionState(overrides = {}) {
  return {
    id: overrides.id ?? `tmp-${nid()}`,
    text: overrides.text ?? "",
    weight: overrides.weight ?? 0,
    isCorrect: overrides.isCorrect ?? false,
    status: overrides.status ?? "new",
  };
}

function createQuestionState(overrides = {}) {
  const baseOptions =
    overrides.options ??
    [
      createOptionState({ isCorrect: true, weight: 10 }),
      createOptionState({ isCorrect: false, weight: 0 }),
    ];

  return {
    id: overrides.id ?? `tmp-${nid()}`,
    text: overrides.text ?? "",
    priority: overrides.priority ?? "Low",
    status: overrides.status ?? "new",
    dirty: overrides.dirty ?? true,
    roleIds: overrides.roleIds
      ? Array.from(new Set(overrides.roleIds.filter(Boolean)))
      : [],
    options: baseOptions,
  };
}

function normaliseBankQuestion(raw) {
  if (!raw) return null;

  const roleIds = Array.isArray(raw.questionRoles ?? raw.QuestionRoles)
    ? (raw.questionRoles ?? raw.QuestionRoles)
        .map(
          (qr) =>
            qr.roleId ??
            qr.RoleId ??
            qr.role?.id ??
            qr.Role?.Id ??
            qr.role?.Id ??
            qr.Role?.id
        )
        .filter(Boolean)
    : [];

  const options = Array.isArray(raw.answerOptions ?? raw.AnswerOptions)
    ? (raw.answerOptions ?? raw.AnswerOptions).map((opt) => ({
        id: ensureId(opt.id ?? opt.Id, "bank-option"),
        text: opt.text ?? opt.Text ?? "",
        weight: Number(opt.weight ?? opt.Weight ?? opt.score ?? opt.Score ?? 0),
        isCorrect: Boolean(opt.isCorrect ?? opt.IsCorrect ?? (opt.kind === "correct")),
      }))
    : [];

  return {
    id: ensureId(raw.id ?? raw.Id, "bank-question"),
    text: raw.text ?? raw.Text ?? "Untitled question",
    priority: normalisePriority(raw.priority ?? raw.Priority),
    roleIds: Array.from(new Set(roleIds.map(String))),
    options,
  };
}

function bankQuestionToState(bankQuestion) {
  if (!bankQuestion) return null;

  const options = (bankQuestion.options ?? []).map((opt) =>
    createOptionState({
      text: opt.text ?? "",
      weight: Number.isFinite(opt.weight) ? opt.weight : 0,
      isCorrect: Boolean(opt.isCorrect),
    })
  );

  return createQuestionState({
    text: bankQuestion.text,
    priority: bankQuestion.priority,
    roleIds: bankQuestion.roleIds,
    options,
  });
}

export default function EditSpecificScenario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", risk: "Low", createdAt: null });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionFlash, setQuestionFlash] = useState(null);
  const [pendingQuestionId, setPendingQuestionId] = useState(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankItems, setBankItems] = useState([]);
  const [bankSelected, setBankSelected] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [scenarioResponse, rolesResponse] = await Promise.all([
          api.get(`/api/scenarios/${id}`),
          api.get("/api/roles"),
        ]);

        if (!active) return;

        const payload = normaliseScenario(scenarioResponse.data);
        setScenario(payload);
        setForm({
          title: payload.title,
          description: payload.description,
          risk: payload.risk,
          createdAt: payload.createdAt ?? new Date().toISOString(),
        });
        setQuestions(payload.questions);
        setRoles(Array.isArray(rolesResponse.data) ? rolesResponse.data : []);
      } catch (err) {
        console.error("Failed to load scenario", err);
        if (!active) return;
        setScenario(null);
        setRoles([]);
        setFlash({ type: "err", text: "Could not load scenario." });
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      active = false;
    };
  }, [id]);

  const loadQuestionBank = async (search = "") => {
    setBankLoading(true);
    try {
      const response = await api.get("/api/question", {
        params: search ? { search } : undefined,
      });
      const items = Array.isArray(response.data)
        ? response.data.map(normaliseBankQuestion).filter(Boolean)
        : [];
      setBankItems(items);
      setBankSelected((prev) => {
        if (!prev) return items[0] || null;
        return items.find((item) => item.id === prev.id) || items[0] || null;
      });
    } catch (err) {
      console.error("Failed to load question bank", err);
      setQuestionFlash({ type: "err", text: "Unable to load question bank." });
      setTimeout(() => setQuestionFlash(null), 2200);
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

  const addFromBank = () => {
    if (!bankSelected) return;
    const next = bankQuestionToState(bankSelected);
    if (!next) return;
    setQuestions((prev) => [...prev, next]);
    setBankOpen(false);
    setQuestionFlash({ type: "ok", text: "Question added from bank. Review and save it." });
    setTimeout(() => setQuestionFlash(null), 2200);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createQuestionState()]);
    setQuestionFlash({ type: "ok", text: "New question added. Remember to save it." });
    setTimeout(() => setQuestionFlash(null), 2200);
  };

  const removeQuestion = async (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.status === "new" || isTempId(questionId)) {
      if (!confirm("Remove this unsaved question?")) return;
    } else {
      const confirmation = prompt('Type "DELETE" to confirm removal of this question.');
      if (confirmation !== "DELETE") return;
    }

    if (question.status === "new" || isTempId(questionId)) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      return;
    }

    setPendingQuestionId(questionId);
    try {
      await api.delete(`/api/question/${questionId}`);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setQuestionFlash({ type: "ok", text: "Question removed." });
    } catch (err) {
      console.error("Failed to delete question", err);
      setQuestionFlash({ type: "err", text: "Could not remove question." });
    } finally {
      setPendingQuestionId(null);
      setTimeout(() => setQuestionFlash(null), 2000);
    }
  };

  const markQuestionDirty = (questionId, updater) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const draft = typeof updater === "function" ? updater(q) : { ...q, ...updater };
        const roleIds = draft.roleIds
          ? Array.from(new Set(draft.roleIds.filter(Boolean)))
          : draft.roleIds ?? q.roleIds ?? [];
        return {
          ...draft,
          roleIds,
          dirty: true,
        };
      })
    );
  };

  const addOption = (questionId) => {
    markQuestionDirty(questionId, (q) => ({
      ...q,
      options: [...q.options, createOptionState()],
    }));
  };

  const removeOption = (questionId, optionId) => {
    markQuestionDirty(questionId, (q) => {
      if (isTempId(optionId)) {
        return {
          ...q,
          options: q.options.filter((o) => o.id !== optionId),
        };
      }

      return {
        ...q,
        options: q.options.map((o) =>
          o.id === optionId ? { ...o, status: "deleted" } : o
        ),
      };
    });
  };

  const updateOption = (questionId, optionId, patch) => {
    markQuestionDirty(questionId, (q) => ({
      ...q,
      options: q.options.map((o) => {
        if (o.id !== optionId) return o;
        const nextStatus = o.status === "new" || isTempId(o.id) ? "new" : "updated";
        return { ...o, ...patch, status: nextStatus };
      }),
    }));
  };

  // Automatisk Weight logik: IsCorrect=true → Weight=10 (default), IsCorrect=false → Weight=0 (default)
  const toggleOptionCorrect = (questionId, optionId) => {
    markQuestionDirty(questionId, (q) => ({
      ...q,
      options: q.options.map((o) => {
        if (o.id !== optionId) return o;
        const nextStatus = o.status === "new" || isTempId(o.id) ? "new" : "updated";
        const newIsCorrect = !o.isCorrect;
        // Automatisk Weight: hvis IsCorrect=true og Weight=0, sæt Weight=10
        // Hvis IsCorrect=false, sæt Weight=0 (altid)
        const newWeight = newIsCorrect 
          ? (o.weight === 0 ? 10 : o.weight) 
          : 0; // Incorrect options should always have weight 0
        return { ...o, isCorrect: newIsCorrect, weight: newWeight, status: nextStatus };
      }),
    }));
  };

  const sanitizeOptions = (options) => options.filter((o) => o.status !== "deleted");

  const saveQuestion = async (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const activeOptions = sanitizeOptions(question.options);
    const roleIds = Array.from(new Set((question.roleIds ?? []).filter(Boolean)));
    if (!question.text.trim()) {
      setQuestionFlash({ type: "err", text: "Question text is required." });
      setTimeout(() => setQuestionFlash(null), 2000);
      return;
    }
    if (activeOptions.length === 0) {
      setQuestionFlash({ type: "err", text: "Add at least one answer option." });
      setTimeout(() => setQuestionFlash(null), 2000);
      return;
    }
    if (!activeOptions.some((o) => o.isCorrect)) {
      setQuestionFlash({ type: "err", text: "Mark at least one option as correct." });
      setTimeout(() => setQuestionFlash(null), 2000);
      return;
    }

    setPendingQuestionId(questionId);

    try {
      let persistedQuestionId = question.id;

      if (question.status === "new" || isTempId(question.id)) {
        const { data } = await api.post("/api/question", {
          scenarioId: scenario.id,
          text: question.text,
          priority: question.priority,
          roleIds,
        });
        persistedQuestionId = data;
      } else if (question.dirty) {
        await api.put(`/api/question/${question.id}`, {
          text: question.text,
          priority: question.priority,
          roleIds,
        });
      }

      const nextOptions = [];
      for (const option of question.options) {
        if (option.status === "deleted") {
          if (!isTempId(option.id)) {
            await api.delete(`/api/answeroption/${option.id}`);
          }
          continue;
        }

        if (option.status === "new" || isTempId(option.id) || question.status === "new") {
          // Automatisk Weight logik før API kald
          let weight = option.weight;
          if (option.isCorrect && weight === 0) {
            weight = 10; // Default for correct answers
          } else if (!option.isCorrect) {
            // Incorrect options should always have weight 0
            weight = 0;
          }
          
          const { data } = await api.post("/api/answeroption", {
            questionId: persistedQuestionId,
            text: option.text,
            weight: weight,
            isCorrect: option.isCorrect,
          });
          nextOptions.push({
            ...option,
            id: data,
            status: "existing",
          });
        } else if (option.status === "updated") {
          // Automatisk Weight logik før API kald
          let weight = option.weight;
          if (option.isCorrect && weight === 0) {
            weight = 10; // Default for correct answers
          } else if (!option.isCorrect) {
            // Incorrect options should always have weight 0
            weight = 0;
          }
          
          await api.put(`/api/answeroption/${option.id}`, {
            text: option.text,
            weight: weight,
            isCorrect: option.isCorrect,
          });
          nextOptions.push({
            ...option,
            status: "existing",
          });
        } else {
          nextOptions.push(option);
        }
      }

      const updatedQuestion = {
        ...question,
        id: persistedQuestionId,
        status: "existing",
        dirty: false,
        roleIds,
        options: nextOptions,
      };

      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? updatedQuestion : q))
      );
      setQuestionFlash({ type: "ok", text: "Question saved." });
    } catch (err) {
      console.error("Failed to save question", err);
      setQuestionFlash({ type: "err", text: "Could not save question." });
    } finally {
      setPendingQuestionId(null);
      setTimeout(() => setQuestionFlash(null), 2000);
    }
  };

  const handleSave = async () => {
    if (!scenario) return;
    setSaving(true);

    try {
      await api.put(`/api/scenarios/${scenario.id}`, {
        title: form.title,
        description: form.description,
        risk: form.risk,
        createdAt: form.createdAt,
      });
      setScenario((prev) =>
        prev
          ? {
              ...prev,
              title: form.title,
              description: form.description,
              risk: form.risk,
            }
          : prev
      );
      setFlash({ type: "ok", text: "Scenario updated successfully." });
      setTimeout(() => setFlash(null), 2000);
    } catch (err) {
      console.error("Failed to save scenario", err);
      setFlash({ type: "err", text: "Failed to save scenario changes." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-root">
        <div className="container">
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="admin-root">
        <div className="container">
          <p>Scenario not found.</p>
          <button className="btn-outlined" onClick={() => navigate("/admin/scenarios")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

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

          <div className="row gap">
            <button className="btn-outlined" onClick={() => navigate(`/admin/scenario/${id}`)}>
              ← Back to view
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="container create-wrap">
        <h1 className="page-title">Edit Scenario</h1>
        <p className="page-subtitle">Update scenario metadata and review its questions.</p>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}

        <div className="panel">
          <h3 className="panel-title">Scenario details</h3>

          <div className="form-row">
            <label>Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <label>Risk</label>
            <select
              className="input"
              value={form.risk}
              onChange={(e) => setForm((prev) => ({ ...prev, risk: e.target.value }))}
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
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

          {questionFlash && <div className={`flash ${questionFlash.type}`}>{questionFlash.text}</div>}

          {questions.length === 0 ? (
            <div className="muted tiny">No questions yet.</div>
          ) : (
            questions.map((q, index) => {
              const activeOptions = q.options.filter((o) => o.status !== "deleted");
              const hasUnsaved =
                q.status === "new" ||
                q.dirty ||
                activeOptions.some((o) => o.status === "new" || o.status === "updated");

              return (
            <div key={q.id} className="q-card">
                  <div className="q-head">
                    <div>
                      <b>Q{index + 1}</b>
                      {hasUnsaved && (
                        <span className="pill amber" style={{ marginLeft: 8 }}>
                          Unsaved
                        </span>
                      )}
                    </div>
                    <div className="row gap">
                      <button
                        className="btn-ghost"
                        disabled={pendingQuestionId === q.id}
                        onClick={() => removeQuestion(q.id)}
                      >
                        {pendingQuestionId === q.id ? "Removing…" : "Remove"}
                      </button>
                      <button
                        className="btn-primary"
                        disabled={pendingQuestionId === q.id || !hasUnsaved}
                        onClick={() => saveQuestion(q.id)}
                      >
                        {pendingQuestionId === q.id ? "Saving…" : "Save question"}
                      </button>
                    </div>
                  </div>

                  <div className="form-row">
                    <label>Question text</label>
                    <textarea
                className="input"
                      rows={2}
                value={q.text}
                      onChange={(e) => markQuestionDirty(q.id, { text: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <label>Priority</label>
                    <select
                      className="input"
                      value={q.priority}
                      onChange={(e) => markQuestionDirty(q.id, { priority: e.target.value })}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label>Audience (roles)</label>
                    <RolePicker
                      options={roles}
                      value={q.roleIds ?? []}
                      onChange={(roleIds) => markQuestionDirty(q.id, { roleIds })}
                      disabled={roles.length === 0}
                    />
                    {roles.length === 0 && (
                      <div className="muted tiny">No roles available yet. Questions will be visible to everyone.</div>
                    )}
                  </div>

                  <div className="opts">
                    <div className="opts-head">
                      <h4>Answer options</h4>
                      <button className="btn-ghost" onClick={() => addOption(q.id)}>
                        + Add option
                      </button>
                    </div>

                    {activeOptions.length === 0 ? (
                      <div className="muted tiny">
                        No options yet. Add at least one before saving.
                      </div>
                    ) : (
                      activeOptions.map((o, oi) => (
                        <div
                          key={o.id}
                          className={`opt-row ${o.isCorrect ? "status-correct" : "status-incorrect"}`}
                        >
                          <button
                            type="button"
                            className={`opt-check ${o.isCorrect ? "correct" : ""}`}
                            onClick={() => toggleOptionCorrect(q.id, o.id)}
                            title={o.isCorrect ? "Mark as incorrect" : "Mark as correct"}
                          >
                            {o.isCorrect ? "✓" : "×"}
                          </button>

                          <input
                            className="input"
                            value={o.text}
                            placeholder={`Option ${oi + 1} text`}
                            onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                          />

                          <input
                            className="input score"
                            type="number"
                            min="0"
                            step="1"
                            value={o.weight}
                            onChange={(e) =>
                              updateOption(q.id, o.id, { weight: Number(e.target.value) })
                            }
                          />

                          <button className="btn-ghost danger" onClick={() => removeOption(q.id, o.id)}>
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
            </div>
              );
            })
          )}
        </div>
      </div>

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

            <div className="panel bank-body">
              <input
                className="input"
                placeholder="Search question text…"
                value={bankQuery}
                onChange={(event) => searchBank(event.target.value)}
              />

              <div className="bank-controls">
                {bankLoading ? (
                  <div className="muted tiny">Loading…</div>
                ) : (
                  <select
                    className="input bank-select"
                    value={bankSelected?.id || ""}
                    onChange={(event) => {
                      const picked = bankItems.find((item) => item.id === event.target.value);
                      setBankSelected(picked || null);
                    }}
                  >
                    <option value="" disabled>
                      {bankItems.length === 0 ? "No questions available" : "Choose a question…"}
                    </option>
                    {bankItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.text}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {bankSelected && (
                <div className="preview-card is-wrapped" style={{ marginTop: 8 }}>
                  <h3 className="q-title">{bankSelected.text}</h3>

                  <div className="muted tiny" style={{ marginBottom: 6 }}>
                    Priority: {bankSelected.priority}
                  </div>

                  <div className="muted tiny" style={{ marginBottom: 6 }}>
                    Roles: {bankSelected.roleIds?.length
                      ? bankSelected.roleIds
                          .map((roleId) => {
                            const role = roles.find((r) => (r.id ?? r.Id) === roleId);
                            return role ? role.name ?? role.Name ?? roleId : roleId;
                          })
                          .join(", ")
                      : "All"}
                  </div>

                  <div className="opts-title">Options</div>
                  {(bankSelected.options ?? []).map((opt) => (
                    <div
                      key={opt.id}
                      className={`opt-row ${opt.isCorrect ? "status-correct" : "status-incorrect"}`}
                    >
                      <div className={`opt-check ${opt.isCorrect ? "correct" : ""}`} aria-hidden>
                        {opt.isCorrect ? "✓" : "×"}
                      </div>
                      <div className="opt-text">{opt.text}</div>
                      <div className="pill pill-score">{opt.weight}</div>
                      <div className={`pill pill-verdict ${opt.isCorrect ? "correct" : "incorrect"}`}>
                        {opt.isCorrect ? "correct" : "incorrect"}
                      </div>
                    </div>
                  ))}

                  <div className="drawer-actions" style={{ justifyContent: "flex-start", gap: 10 }}>
                    <button className="btn-primary" onClick={addFromBank} disabled={bankLoading}>
                      Add as copy
                    </button>
                    <button className="btn-ghost" onClick={() => loadQuestionBank(bankQuery)}>
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              {!bankLoading && bankItems.length === 0 && (
                <div className="muted tiny" style={{ marginTop: 12 }}>
                  No questions found. Try a different search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
