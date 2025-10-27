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

/* —— mock API for one scenario —— */
async function fetchScenarioDetail(id){
  await new Promise(r=>setTimeout(r,350));
  return {
    id:"scn-001",
    title:"Ransomware Detected",
    difficulty:"Intermediate",
    tags:["Security","IR"],
    est:"15–20 min",
    color: pickColor(0),
    sections: [
      {
        id:"sec-1",
        title:"Triage & Containment",
        questions:[
          {
            id:"q1",
            text:"What is your first action when detecting ransomware activity?",
            options:[
              { id:"a", text:"Disconnect affected servers from the network immediately.", score:10, kind:"correct" },
              { id:"b", text:"Run antivirus scans on all systems right away.", score:2,  kind:"incorrect" },
              { id:"c", text:"Inform customers that data may be lost.",          score:2,  kind:"incorrect" },
              { id:"d", text:"I did not take any action.",                        score:0,  kind:"none" },
            ],
            hint:"Contain first. Investigate second.",
          },
          {
            id:"q2",
            text:"After isolating servers, what should be your next priority?",
            options:[
              { id:"a", text:"Restore systems from backup immediately.",            score:2,  kind:"incorrect" },
              { id:"b", text:"Notify the incident response team and security lead.",score:10, kind:"correct" },
              { id:"c", text:"Delete encrypted files to save storage.",             score:2,  kind:"incorrect" },
              { id:"d", text:"I did not take any action.",                          score:0,  kind:"none" },
            ],
          },
        ]
      },
      {
        id:"sec-2",
        title:"Preservation & Communication",
        questions:[
          {
            id:"q3",
            text:"What data is most critical to preserve during a ransomware incident?",
            options:[
              { id:"a", text:"Encrypted system files only.",                        score:2,  kind:"incorrect" },
              { id:"b", text:"User data and temp logs.",                            score:5,  kind:"partial"   },
              { id:"c", text:"All forensic logs and system images before reboot.",  score:10, kind:"correct"   },
              { id:"d", text:"I didn’t preserve any data.",                         score:0,  kind:"none"      },
            ],
            hint:"Think forensics & later analysis.",
          },
          {
            id:"q4",
            text:"When should communication with management occur?",
            options:[
              { id:"a", text:"Immediately after detection to escalate response.", score:10, kind:"correct" },
              { id:"b", text:"Only after resolving the issue.",                  score:2,  kind:"incorrect" },
              { id:"c", text:"When ransom note includes customer data threats.", score:2,  kind:"incorrect" },
              { id:"d", text:"I didn’t communicate with management.",           score:0,  kind:"none"      },
            ],
          },
          {
            id:"q5",
            text:"What’s the correct procedure regarding ransom payment?",
            options:[
              { id:"a", text:"Pay the ransom if the data is mission-critical.",     score:2,  kind:"incorrect" },
              { id:"b", text:"Contact legal and law enforcement before deciding.",  score:10, kind:"correct"   },
              { id:"c", text:"Ask IT to handle the payment internally.",            score:2,  kind:"incorrect" },
              { id:"d", text:"I didn’t escalate or respond.",                       score:0,  kind:"none"      },
            ],
          },
        ]
      }
    ]
  };
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

export default function Train(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth(); // available if you add a top-right menu

  const [loading, setLoading] = useState(true);
  const [sc, setSc] = useState(null);
  const [answers, setAnswers] = useState({});      // { qid: optionId }
  const [submitted, setSubmitted] = useState(false);

  useEffect(()=>{
    let live = true;
    fetchScenarioDetail(id).then(d => { if(live){ setSc(d); setLoading(false); }});
    return () => { live = false; };
  },[id]);

  const allQs = useMemo(() => sc ? sc.sections.flatMap(s => s.questions) : [], [sc]);

  const maxScore = useMemo(() =>
    allQs.reduce((sum,q)=>sum+Math.max(...q.options.map(o=>o.score)),0)
  ,[allQs]);

  const score = useMemo(() =>
    allQs.reduce((sum,q)=>{
      const pick = answers[q.id];
      if(!pick) return sum;
      const op = q.options.find(o=>o.id===pick);
      return sum + (op?.score ?? 0);
    },0)
  ,[answers, allQs]);

  const answeredCount = Object.keys(answers).length;

  // NEW: progress vs score logic
  const progressPct = allQs.length ? Math.round((answeredCount / allQs.length) * 100) : 0;
  const scorePct    = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const gaugePct    = submitted ? scorePct : progressPct;

  const select = (qid, oid) => { if(!submitted) setAnswers(a => ({...a, [qid]: oid})); };
  const submit = () => { setSubmitted(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const restart = () => { setAnswers({}); setSubmitted(false); };

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

  // helpers for verdict & per-question badge after submit
  const verdictFor = (q) => {
    if (!submitted) return null;
    const chosen = q.options.find(o => o.id === answers[q.id]);
    if (!chosen) return null;
    return chosen.kind; // "correct" | "partial" | "incorrect" | "none"
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
                const done = sec.questions.filter(q => answers[q.id]).length;
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
                  <button className="btn-ghost" onClick={restart}>Restart</button>
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
                  const v = verdictFor(q); // null | "correct" | "partial" | "incorrect" | "none"
                  return (
                    <article key={q.id} className="q-card">
                      <div className="q-top">
                        <div className="q-id">Q{idx + 1 + (si === 0 ? 0 : sc.sections[0].questions.length)}</div>
                        <div className="q-text">{q.text}</div>
                        <div className="q-badge">{badgeIcon(v)}</div>
                      </div>

                      <div className="opts">
                        {q.options.map((op)=>{
                          const chosen = answers[q.id] === op.id;

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

                      {q.hint && !submitted && <div className="hint">Hint: {q.hint}</div>}
                      {submitted && (
                        <div className="post">
                          <span className="tag">
                            Your score for this question:&nbsp;
                            {q.options.find(o=>o.id===answers[q.id])?.score ?? 0}
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