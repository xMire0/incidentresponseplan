// src/pages/Train.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../services/api";
import "./train.css";

/* —— palette helpers —— */
const THEME = [
  { from: "#67e8f9", to: "#60a5fa" }, // cyan → blue
  { from: "#34d399", to: "#10b981" }, // green
  { from: "#a78bfa", to: "#6366f1" }, // purple
  { from: "#f59e0b", to: "#ef4444" }, // amber → red
];
const pickColor = (i) => THEME[i % THEME.length];
const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const toGuidString = (value) => {
  if (!value) return null;
  if (typeof value === "string" && GUID_REGEX.test(value)) return value.toLowerCase();
  return null;
};

/* —— Review mode helper —— */
const isReviewMode = () => new URLSearchParams(window.location.search).get("review") === "1";

/* backend scenario normalizer */
const normalizeIncidentScenario = (incident, scenario, userRoleId = null) => {
  const incidentId = incident.id ?? incident.Id ?? null;
  const scenarioId = scenario.id ?? scenario.Id ?? null;
  const title = scenario.title ?? scenario.Title ?? incident.title ?? incident.Title ?? "Untitled incident";
  const rawRisk = scenario.risk ?? scenario.Risk ?? "Medium";
  const difficulty = typeof rawRisk === "string" ? rawRisk : String(rawRisk);
  const questions = Array.isArray(scenario.questions ?? scenario.Questions)
    ? scenario.questions ?? scenario.Questions
    : [];

  const color = pickColor(title.length + questions.length);

  const questionRoleIds = new Set();

  const sections = [
    {
      id: `sec-${scenarioId ?? incidentId ?? Math.random().toString(36).slice(2, 8)}`,
      title: "Assessment",
      questions: questions
        .map((question) => {
          const questionId = toGuidString(question.id ?? question.Id);
          if (!questionId) return null;
          const questionText = question.text ?? question.Text ?? "Untitled question";
          const answerOptions = Array.isArray(question.answerOptions ?? question.AnswerOptions)
            ? question.answerOptions ?? question.AnswerOptions
            : [];
          const rawRoles = Array.isArray(question.questionRoles ?? question.QuestionRoles)
            ? question.questionRoles ?? question.QuestionRoles
            : [];
          const roleIds = rawRoles
            .map((roleLink) =>
              toGuidString(
                roleLink.roleId ??
                  roleLink.RoleId ??
                  roleLink.role?.id ??
                  roleLink.role?.Id ??
                  roleLink.Role?.id ??
                  roleLink.Role?.Id
              )
            )
            .filter(Boolean);
          roleIds.forEach((roleId) => questionRoleIds.add(roleId));

          // Filter: Hvis spørgsmålet har roleIds og brugeren har en roleId,
          // skal brugerens roleId være i spørgsmålets roleIds for at vise det
          if (roleIds.length > 0 && userRoleId) {
            const userRoleIdString = typeof userRoleId === 'string' ? userRoleId : String(userRoleId);
            const normalizedUserRoleId = userRoleIdString.toLowerCase();
            const hasMatchingRole = roleIds.some(roleId => roleId.toLowerCase() === normalizedUserRoleId);
            if (!hasMatchingRole) {
              return null; // Skjul spørgsmålet hvis brugeren ikke har den påkrævede rolle
            }
          }
          // Hvis spørgsmålet ikke har nogen roleIds, vises det til alle (ingen filtrering)

          const correctCount = answerOptions.filter((option) => option?.isCorrect ?? option?.IsCorrect).length;

          return {
            id: questionId,
            text: questionText,
            options: answerOptions
              .map((option) => {
                const optionId = toGuidString(option.id ?? option.Id);
                if (!optionId) return null;
                const text = option.text ?? option.Text ?? "";
                const isCorrect = Boolean(option.isCorrect ?? option.IsCorrect);
                const weight = Number(option.weight ?? option.Weight ?? 0);
                const kind = isCorrect ? "correct" : "incorrect";
                // Use the actual weight from the option, don't normalize to minimum 10
                // The weight should already be set correctly by the backend
                const score = weight;
                return {
                  id: optionId,
                  text,
                  score: score,
                  kind,
                };
              })
              .filter((option) => option && option.text.length > 0),
            correctCount,
            roleIds,
          };
        })
        .filter((question) => question && question.options.length > 0),
    },
  ];

  // Get visible questions (after role filtering) for tags and estimation
  const visibleQuestions = sections[0]?.questions ?? [];
  
  const tags = Array.from(
    new Set(
      visibleQuestions.flatMap((question) => {
        // Get roles from the original question data if available
        const questionData = questions.find(q => {
          const qId = toGuidString(q.id ?? q.Id);
          return qId === question.id;
        });
        if (!questionData) return [];
        
        const roles = Array.isArray(questionData.questionRoles ?? questionData.QuestionRoles)
          ? questionData.questionRoles ?? questionData.QuestionRoles
          : [];
        return roles
          .map((questionRole) => questionRole.role?.name ?? questionRole.role?.Name ?? questionRole.Role?.name ?? questionRole.Role?.Name)
          .filter(Boolean);
      })
    )
  );

  // Use visible questions count for time estimation
  const est = visibleQuestions.length ? `${Math.max(5, visibleQuestions.length * 5)}–${Math.max(10, visibleQuestions.length * 7)} min` : "10–15 min";

  const rawStatus = incident.status ?? incident.Status ?? "NotStarted";
  const statusKey = typeof rawStatus === "string" ? rawStatus : String(rawStatus);

  return {
    id: incidentId,
    scenarioId,
    title,
    difficulty,
    tags: tags.length ? tags : [difficulty],
    est,
    color,
    sections,
    statusKey,
    isCompleted: statusKey === "Completed",
    roleIds: Array.from(questionRoleIds),
  };
};

const normalizeIncidentData = (raw, userRoleId = null) => {
  if (!raw) return null;

  const scenario = raw.scenario ?? raw.Scenario ?? null;
  if (!scenario) return null;

  return normalizeIncidentScenario(raw, scenario, userRoleId);
};

/* small icons */
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
    <path d="M15 6l-6 6 6 6" stroke="#E9EEF5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSpark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="white" opacity=".92"/>
  </svg>
);
const IconDot = () => <span className="r-dot" aria-hidden />;
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="r-check" aria-hidden>
    <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCross = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="r-cross" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
// IconTilde removed - no longer needed (partial verdict removed)

/* ---------- helpers for multi-select ---------- */
const getCorrectIds = (q) => q.options.filter(o => o.kind === "correct").map(o => o.id);
const selectionLimit = (q) => Math.max(1, getCorrectIds(q).length);
const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

export default function Train(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sc, setSc] = useState(null);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // answers: { [qid]: string[] }  (multi-select)
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const review = isReviewMode();

  useEffect(()=>{
    let live = true;
    setLoading(true);
    setError(null);
    
    // Check if user has already responded (backend check)
    const checkUserResponse = async (incidentId) => {
      try {
        const params = new URLSearchParams();
        if (user?.email) params.append("userEmail", user.email);
        const { data: hasResponded } = await api.get(`/api/response/check/${incidentId}?${params.toString()}`);
        return hasResponded === true;
      } catch (err) {
        console.warn("Failed to check user response status", err);
        return false; // If check fails, allow user to proceed (fail open)
      }
    };

    Promise.all([
      api.get(`/api/incident/${id}`),
      api.get(`/api/incident/${id}`).then(({ data }) => checkUserResponse(data?.id ?? data?.Id ?? id))
    ])
      .then(([{ data }, userHasResponded]) => {
        if (!live) return;
        // Get user's roleId for filtering questions
        const userRoleId = user?.roleId ?? user?.RoleId ?? null;
        const detail = normalizeIncidentData(data, userRoleId);
        if (!detail) {
          setError("Scenario not found.");
          setSc(null);
          return;
        }
        setSc(detail);
        
        // Check backend - if user has responded, mark as submitted
        if (userHasResponded || detail.isCompleted) {
          setSubmitted(true);
        }
        
        // In review mode or if completed, we should load answers from backend
        // For now, just mark as submitted - answers will be loaded from backend responses
        if (review || detail.isCompleted || userHasResponded) {
          setSubmitted(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load scenario", err);
        if (live) {
          setError("Could not load scenario. Please try again later.");
          setSc(null);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
    });
    return () => { live = false; };
  },[id, review, user]);

  useEffect(() => {
    if (!sc || review) return;
    if (sc.statusKey !== "NotStarted") return;

    let cancelled = false;

    (async () => {
      try {
        await api.put(`/api/incident/${sc.id}`, {
          status: "InProgress",
          startedAt: new Date().toISOString(),
        });
        if (!cancelled) {
          setSc((prev) =>
            prev
              ? {
                  ...prev,
                  statusKey: "InProgress",
                }
              : prev
          );
        }
      } catch (err) {
        console.error("Failed to mark incident in progress", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sc, review]);

  const allQs = useMemo(() => sc ? sc.sections.flatMap(s => s.questions) : [], [sc]);

  // Max possible score = sum of scores for all "correct" options (supports multi-correct)
  const maxScore = useMemo(() =>
    allQs.reduce((sum,q)=>
      sum + q.options
        .filter(o=>o.kind==="correct")
        .reduce((s,o)=>s + (Number(o.score)||0), 0)
    ,0)
  ,[allQs]);

  // sum of scores of all selected options
  const score = useMemo(() =>
    allQs.reduce((sum,q)=>{
      const picks = arr(answers[q.id]);
      if (!picks.length) return sum;
      const pickedOptions = q.options.filter(o => picks.includes(o.id));
      return sum + pickedOptions.reduce((s,o)=>s + (Number(o.score) || 0), 0);
    },0)
  ,[answers, allQs]);

  const answeredCount = useMemo(
    () => allQs.filter(q => arr(answers[q.id]).length > 0).length,
    [answers, allQs]
  );

  // progress vs score logic
  const progressPct = allQs.length ? Math.round((answeredCount / allQs.length) * 100) : 0;
  const scorePct    = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const gaugePct    = submitted ? scorePct : progressPct;

  // selection: toggle with cap = #correct (min 1)
  const select = (qid, oid) => {
    if (submitted) return;
    setAnswers(prev => {
      const cur = arr(prev[qid]);
      const q   = allQs.find(x => x.id === qid);
      const cap = selectionLimit(q);

      // already selected -> unselect
      if (cur.includes(oid)) {
        const next = cur.filter(id => id !== oid);
        return { ...prev, [qid]: next };
      }

      // single-select (cap=1) -> replace
      if (cap === 1) {
        return { ...prev, [qid]: [oid] };
      }

      // multi-select
      if (cur.length < cap) {
        return { ...prev, [qid]: [...cur, oid] };
      }

      // at cap: replace oldest with new (keeps UX simple)
      const next = [...cur.slice(1), oid];
      return { ...prev, [qid]: next };
    });
  };

  const submit = async () => {
    if (!sc) return;
    setSubmitError(null); // Clear previous errors
    setSubmitted(true);

    const defaultRoleId = sc.roleIds?.find((roleId) => GUID_REGEX.test(roleId)) ?? null;

    const bulkPayload = {
      incidentId: sc.id,
      markCompleted: false, // Employees don't mark incidents as completed globally
      responses: allQs.flatMap((question) => {
        const picks = arr(answers[question.id]);
        if (!picks.length) return [];
        return picks.map((optionId) => {
          const roleCandidate =
            Array.isArray(question.roleIds) && question.roleIds.length > 0
              ? question.roleIds.find((roleId) => GUID_REGEX.test(roleId))
              : defaultRoleId;
          return {
            incidentId: sc.id,
            questionId: question.id,
            answerOptionId: optionId,
            answer: null,
            roleId: roleCandidate ?? null,
            userId: null,
            userEmail: user?.email ?? null,
            answeredAt: new Date().toISOString(),
          };
        });
      }),
    };

    try {
      await api.post("/api/response/bulk", bulkPayload);
      setSubmitError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("Failed to persist responses", err);
      const errorMessage = err.response?.data?.message || err.message || "";
      if (err.response?.status === 400 || errorMessage.includes("already submitted") || errorMessage.includes("Duplicate")) {
        setSubmitError("You have already submitted responses for this incident. Duplicate submissions are not allowed.");
        setSubmitted(true); // Mark as submitted to prevent further attempts
      } else {
        setSubmitError("Failed to submit responses. Please try again.");
        setSubmitted(false); // Allow retry for non-duplicate errors
      }
      return; // Don't proceed if submission failed
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="trainX">
        <div className="bg-blob t-a"/><div className="bg-blob t-b"/><div className="bg-blob t-c"/>
        <div className="container">
          <div className="train-shell">
            <div className="header glass skeleton-h"/>
            <div className="layout">
              <aside className="aside glass skeleton-a"/>
              <main className="main glass skeleton-m"/>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="trainX">
        <div className="bg-blob t-a"/><div className="bg-blob t-b"/><div className="bg-blob t-c"/>
        <div className="container">
          <div className="train-shell">
            <div className="header glass" style={{ justifyContent: "space-between" }}>
              <button className="btn-ghost" onClick={() => navigate("/employee") }>
                <span className="ico"><IconBack/></span> Back
              </button>
            </div>
            <div className="layout">
              <main className="main glass" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>Unable to load scenario</h3>
                <p className="muted">{error}</p>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sc) return null;

  // If user opened /train/:id?review=1, check if they have responses in backend
  if (review && !submitted) {
    return (
      <div className="trainX">
        <div className="bg-blob t-a"/><div className="bg-blob t-b"/><div className="bg-blob t-c"/>
        <div className="container">
          <div className="header glass" style={{justifyContent:"space-between"}}>
            <button className="btn-ghost" onClick={()=>navigate("/employee")}>
              <span className="ico"><IconBack/></span> Back
            </button>
            <div className="head-mid">
              <div className="spark" style={{background:`linear-gradient(135deg, ${sc.color.from}, ${sc.color.to})`}}>
                <IconSpark/>
              </div>
              <div className="head-txt">
                <h1 className="h-title">{sc.title}</h1>
                <p className="h-sub">{sc.tags.join(" • ")} • {sc.est}</p>
              </div>
              <span className="pill">{sc.difficulty}</span>
            </div>
            <div />
          </div>

          <div className="layout">
            <main className="main glass" style={{padding:"24px"}}>
              <h3 style={{marginTop:0}}>No saved attempt to review</h3>
              <p className="muted" style={{marginBottom:16}}>
                Start the test first, submit your answers, and then you can review them here.
              </p>
              <button
                className="btn-glow"
                style={{background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`, maxWidth:240}}
                onClick={()=>navigate(`/train/${id}`)}  // same page, without ?review=1
              >
                <span className="shine"/>
                Start test
              </button>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // verdict for a question after submit (correct/incorrect/none)
  const verdictFor = (q) => {
    if (!submitted) return null;
    const picks = arr(answers[q.id]);
    if (!picks.length) return "none";

    const correctIds = new Set(getCorrectIds(q));
    const pickedCorrectCount = picks.filter(id => correctIds.has(id)).length;
    const pickedIncorrect    = picks.some(id => !correctIds.has(id));

    // Verdict logik: kun "correct" eller "incorrect" (fjernet "partial")
    // "correct": alle korrekte svar valgt OG ingen forkerte svar valgt
    // "incorrect": alt andet
    if (correctIds.size > 0 && pickedCorrectCount === correctIds.size && !pickedIncorrect) return "correct";
    return "incorrect";
  };

  const badgeIcon = (kind) => {
    if (kind === "correct") return <IconCheck/>;
    if (kind === "incorrect" || kind === "none") return <IconCross/>;
    return null;
  };

  return (
    <div className="trainX">
      {/* ambient */}
      <div className="bg-blob t-a"/><div className="bg-blob t-b"/><div className="bg-blob t-c"/>

      <div className="container">
        {/* HEADER — timer removed */}
        <div className="header glass">
          <button className="btn-ghost" onClick={()=>navigate("/employee")}>
            <span className="ico"><IconBack/></span> Back
          </button>

          <div className="head-mid">
            <div
              className="spark"
              style={{background:`linear-gradient(135deg, ${sc.color.from}, ${sc.color.to})`}}
            >
              <IconSpark/>
            </div>
            <div className="head-txt">
              <h1 className="h-title">{sc.title}</h1>
              <p className="h-sub">{sc.tags.join(" • ")} • {sc.est}</p>
            </div>
            <span className="pill">{sc.difficulty}</span>
          </div>

          <div className="head-right">
            <div className="bar" aria-label={submitted ? "Score" : "Completion"}>
              <span
                style={{
                  width:`${gaugePct}%`,
                  background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`
                }}
              />
            </div>
            <i>{submitted ? `${scorePct}%` : `${progressPct}%`}</i>
          </div>
        </div>

        {/* BODY */}
        <div className="layout">
          {/* Outline */}
          <aside className="aside glass">
            <h3 className="aside-title">Outline</h3>
            <ol className="outline">
              {sc.sections.map((sec) => {
                const done = sec.questions.filter(q => arr(answers[q.id]).length).length;
                return (
                  <li key={sec.id}>
                    <span className="dot" style={{background:sc.color.to}}/>
                    <div>
                      <div className="o-title">{sec.title}</div>
                      <div className="o-sub">{sec.questions.length} questions</div>
                    </div>
                    <div className="o-count">{done}/{sec.questions.length}</div>
                  </li>
                );
              })}
            </ol>

            <div className="aside-meta"><div>Max score</div><b>{maxScore}</b></div>
            <div className="aside-meta"><div>Answered</div><b>{answeredCount}/{allQs.length}</b></div>

            {!submitted ? (
              <>
                {submitError && (
                  <div style={{padding: "12px", marginBottom: "12px", background: "#fee", border: "1px solid #fcc", borderRadius: "6px", color: "#c33"}}>
                    {submitError}
                  </div>
                )}
                <button
                  className="btn-glow"
                  style={{background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`}}
                  onClick={submit}
                  disabled={answeredCount === 0}
                >
                  <span className="shine"/>
                  Submit answers
                </button>
              </>
            ) : (
              <div className="result-box">
                <div className="r-title">Result</div>
                <div className="r-score">{score} / {maxScore}</div>
                <div className="r-pct">{scorePct}%</div>
                <div className="r-actions">
                <button className="btn-ghost" onClick={()=>navigate("/employee")}>Back to list</button>
              </div>
              </div>
            )}
          </aside>

          {/* Questions */}
          <main className="main glass">
            {sc.sections.map((sec, si)=>(
              <section key={sec.id} className="sec">
                <div className="sec-head">
                  <div
                    className="spark small"
                    style={{background:`linear-gradient(135deg, ${sc.color.from}, ${sc.color.to})`}}
                  >
                    <IconSpark/>
                  </div>
                  <h2>{sec.title}</h2>
                </div>

                {sec.questions.map((q, idx)=> {
                  const v = verdictFor(q); // "correct" | "incorrect" | "none" | null
                  const cap = selectionLimit(q);
                  const selected = new Set(arr(answers[q.id]));
                  const questionIndex = idx + (si === 0 ? 0 : sc.sections[0].questions.length);

                  return (
                    <article key={q.id} className="q-card">
                      <div className="q-top">
                        <div className="q-id">Q{questionIndex + 1}</div>
                        <div className="q-text">{q.text}</div>
                        <div className="q-badge">{badgeIcon(v)}</div>
                      </div>

                      {!submitted && (
                        <div className="q-cap muted" style={{marginBottom:8}}>
                          Select up to <b>{cap}</b> answer{cap>1?"s":""}.
                        </div>
                      )}

                      <div className="opts">
                        {q.options.map((op)=>{
                          const chosen = selected.has(op.id);

                          // after submit, show truth-state colors
                          const postClass = submitted
                            ? (op.kind === "correct" ? "correct"
                              : chosen ? "wrong" : "")
                            : "";

                          return (
                            <button
                              key={op.id}
                              type="button"
                              className={`opt ${chosen ? "active":""} ${postClass}`}
                              onClick={()=>select(q.id, op.id)}
                              disabled={submitted}
                              style={{ "--acc1": sc.color.from, "--acc2": sc.color.to }}
                            >
                              <span className="radio">
                                {submitted
                                  ? (op.kind === "correct" ? <IconCheck/> :
                                     chosen ? <IconCross/> : <IconDot/>)
                                  : <IconDot/>}
                              </span>
                              <span className="opt-text">{op.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint removed by request */}
                      {submitted && (
                        <div className="post">
                          <span className="tag">
                            Your score for this question:&nbsp;
                            {q.options
                              .filter(o=>arr(answers[q.id]).includes(o.id))
                              .reduce((s,o)=>s+(Number(o.score)||0),0)}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}