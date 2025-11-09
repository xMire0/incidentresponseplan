// src/pages/Train.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./train.css";

/* —— palette helpers —— */
const THEME = [
  { from: "#67e8f9", to: "#60a5fa" }, // cyan → blue
  { from: "#34d399", to: "#10b981" }, // green
  { from: "#a78bfa", to: "#6366f1" }, // purple
  { from: "#f59e0b", to: "#ef4444" }, // amber → red
];
const pickColor = (i) => THEME[i % THEME.length];

/* —— localStorage helpers —— */
const reviewKey = (id) => `train:result:${id}`;
const isReviewMode = () => new URLSearchParams(window.location.search).get("review") === "1";

/* —— mock API for one scenario (ID-aware) —— */
async function fetchScenarioDetail(id){
  await new Promise(r=>setTimeout(r,350));

  const SEC_TRIAGE = {
    id:"sec-1",
    title:"Triage & Containment",
    questions:[
      {
        id:"q1",
        text:"What is your first action when detecting ransomware activity?",
        options:[
          { id:"a", text:"Disconnect affected servers from the network immediately.", score:10, kind:"correct" },
          { id:"b", text:"Run antivirus scans on all systems right away.",            score:2,  kind:"incorrect" },
          { id:"c", text:"Inform customers that data may be lost.",                    score:2,  kind:"incorrect" },
          { id:"d", text:"I did not take any action.",                                 score:0,  kind:"none" },
        ],
      },
      {
        id:"q2",
        text:"After isolating servers, what should be your next priority?",
        options:[
          { id:"a", text:"Restore systems from backup immediately.",             score:2,  kind:"incorrect" },
          { id:"b", text:"Notify the incident response team and security lead.", score:10, kind:"correct"   },
          { id:"c", text:"Delete encrypted files to save storage.",              score:2,  kind:"incorrect" },
          { id:"d", text:"I did not take any action.",                           score:0,  kind:"none"      },
        ],
      },
    ],
  };

  const SEC_COMMS = {
    id:"sec-2",
    title:"Preservation & Communication",
    questions:[
      {
        id:"q3",
        text:"What data is most critical to preserve during a ransomware incident?",
        options:[
          { id:"a", text:"Encrypted system files only.",                       score:2,  kind:"incorrect" },
          { id:"b", text:"User data and temp logs.",                           score:5,  kind:"partial"   },
          { id:"c", text:"All forensic logs and system images before reboot.", score:10, kind:"correct"   },
          { id:"d", text:"I didn’t preserve any data.",                        score:0,  kind:"none"      },
        ],
      },
      {
        id:"q4",
        text:"When should communication with management occur?",
        options:[
          { id:"a", text:"Immediately after detection to escalate response.", score:10, kind:"correct"   },
          { id:"b", text:"Only after resolving the issue.",                   score:2,  kind:"incorrect" },
          { id:"c", text:"When ransom note includes customer data threats.",  score:2,  kind:"incorrect" },
          { id:"d", text:"I didn’t communicate with management.",             score:0,  kind:"none"      },
        ],
      },
      {
        id:"q5",
        text:"What’s the correct procedure regarding ransom payment?",
        options:[
          { id:"a", text:"Pay the ransom if the data is mission-critical.",    score:2,  kind:"incorrect" },
          { id:"b", text:"Contact legal and law enforcement before deciding.", score:10, kind:"correct"   },
          { id:"c", text:"Ask IT to handle the payment internally.",           score:2,  kind:"incorrect" },
          { id:"d", text:"I didn’t escalate or respond.",                      score:0,  kind:"none"      },
        ],
      },
    ],
  };

  const MAP = {
    "scn-001": {
      id:"scn-001",
      title:"Ransomware Detected",
      difficulty:"Intermediate",
      tags:["Security","IR"],
      est:"15–20 min",
      color: pickColor(0),
      sections:[SEC_TRIAGE, SEC_COMMS],
    },
    "scn-002": {
      id:"scn-002",
      title:"Phishing Attack on Email",
      difficulty:"Beginner",
      tags:["Email","Awareness"],
      est:"10–15 min",
      color: pickColor(1),
      sections:[
        {
          id:"sec-1",
          title:"Identify & Report",
          questions:[
            {
              id:"q1",
              text:"Which indicators suggest an email is phishing?",
              options:[
                { id:"a", text:"Urgent language and mismatched links.", score:10, kind:"correct" },
                { id:"b", text:"Proper grammar and a company logo.",    score:2,  kind:"incorrect" },
                { id:"c", text:"Sent from a colleague address",         score:2,  kind:"incorrect" },
              ],
            },
          ],
        },
        {
          id:"sec-2",
          title:"Containment",
          questions:[
            {
              id:"q2",
              text:"What is the FIRST action after clicking a suspicious link?",
              options:[
                { id:"a", text:"Disconnect from the network and inform IT.", score:10, kind:"correct" },
                { id:"b", text:"Ignore it if no download started.",          score:2,  kind:"incorrect" },
                { id:"c", text:"Forward to coworkers to check.",             score:0,  kind:"none" },
              ],
            },
          ],
        },
      ],
    },
    "scn-003": {
      id:"scn-003",
      title:"Data Breach – S3 Bucket",
      difficulty:"Advanced",
      tags:["Cloud","Compliance"],
      est:"25–30 min",
      color: pickColor(2),
      sections:[
        {
          id:"sec-1",
          title:"Scope & Access",
          questions:[
            {
              id:"q1",
              text:"Best immediate remediation for public S3 bucket exposure?",
              options:[
                { id:"a", text:"Block public access and rotate IAM creds.", score:10, kind:"correct" },
                { id:"b", text:"Delete the bucket to be safe.",             score:2,  kind:"incorrect" },
                { id:"c", text:"Wait and monitor for a week.",              score:0,  kind:"none" },
              ],
            },
          ],
        },
      ],
    },
    "scn-004": {
      id:"scn-004",
      title:"DDoS on Public API",
      difficulty:"Intermediate",
      tags:["Ops","Network"],
      est:"15–25 min",
      color: pickColor(3),
      sections:[
        {
          id:"sec-1",
          title:"Mitigation",
          questions:[
            {
              id:"q1",
              text:"Which is MOST effective as an immediate DDoS response?",
              options:[
                { id:"a", text:"Enable rate limiting / WAF rules.", score:10, kind:"correct" },
                { id:"b", text:"Scale databases first.",             score:2,  kind:"incorrect" },
                { id:"c", text:"Disable TLS to speed traffic.",      score:2,  kind:"incorrect" },
              ],
            },
          ],
        },
      ],
    },
  };

  return MAP[id] ?? MAP["scn-001"];
}

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
const IconTilde = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="r-partial" aria-hidden>
    <path d="M4 12c3-4 5 4 8 0s5 4 8 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

/* ---------- helpers for multi-select ---------- */
const getCorrectIds = (q) => q.options.filter(o => o.kind === "correct").map(o => o.id);
const selectionLimit = (q) => Math.max(1, getCorrectIds(q).length);
const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

export default function Train(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth(); // available if you add a top-right menu later

  const [loading, setLoading] = useState(true);
  const [sc, setSc] = useState(null);

  // answers: { [qid]: string[] }  (multi-select)
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const review = isReviewMode();
  const hasSavedReview = (() => {
    try { return !!localStorage.getItem(reviewKey(id)); } catch { return false; }
  })();

  useEffect(()=>{
    let live = true;
    fetchScenarioDetail(id).then(d => {
      if(!live) return;
      setSc(d);
      setLoading(false);

      // Hydrate saved answers in review mode (locks the UI)
      if (review) {
        try {
          const saved = JSON.parse(localStorage.getItem(reviewKey(d.id)) || "null");
          if (saved?.answers) {
            setAnswers(saved.answers);
            setSubmitted(true);
          }
        } catch {}
      }
    });
    return () => { live = false; };
  },[id, review]);

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

  const submit = () => {
    setSubmitted(true);
    // Persist for Employee page detection + review mode
    try {
      localStorage.setItem(
        reviewKey(sc.id),
        JSON.stringify({
          answers,
          score,
          maxScore,
          completedAt: new Date().toISOString(),
        })
      );
    } catch {}
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
  if (!sc) return null;

  // If user opened /train/:id?review=1 but no saved attempt exists
  if (review && !hasSavedReview) {
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

  // verdict for a question after submit (correct/partial/incorrect/none)
  const verdictFor = (q) => {
    if (!submitted) return null;
    const picks = arr(answers[q.id]);
    if (!picks.length) return "none";

    const correctIds = new Set(getCorrectIds(q));
    const pickedCorrectCount = picks.filter(id => correctIds.has(id)).length;
    const pickedIncorrect    = picks.some(id => !correctIds.has(id));

    if (pickedCorrectCount === correctIds.size && !pickedIncorrect) return "correct";
    if (pickedCorrectCount > 0) return "partial";
    return "incorrect";
  };

  const badgeIcon = (kind) => {
    if (kind === "correct") return <IconCheck/>;
    if (kind === "partial") return <IconTilde/>;
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
              <button
                className="btn-glow"
                style={{background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`}}
                onClick={submit}
                disabled={answeredCount === 0}
              >
                <span className="shine"/>
                Submit answers
              </button>
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
                  const v = verdictFor(q); // "correct" | "partial" | "incorrect" | "none" | null
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
                              : op.kind === "partial" ? "partial"
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
                                     op.kind === "partial" ? <IconTilde/> :
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