import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./train.css";

/* —— theme helpers (same palette logic as Employee) —— */
const THEME = [
  { from: "#67e8f9", to: "#60a5fa" }, // cyan → blue
  { from: "#34d399", to: "#10b981" }, // green
  { from: "#a78bfa", to: "#6366f1" }, // purple
  { from: "#f59e0b", to: "#ef4444" }, // amber → red
];
const pickColor = (i) => THEME[i % THEME.length];
const rgba = (hex, a=1) => {
  const h = hex.replace("#","");
  const n = h.length===3 ? h.split("").map(c=>c+c).join("") : h;
  const b = parseInt(n,16); const r=(b>>16)&255,g=(b>>8)&255,bl=b&255;
  return `rgba(${r},${g},${bl},${a})`;
};

/* —— mock API: fetch one scenario with questions —— */
/* scoring: correct 10, partial 5, incorrect 2, none 0 */
async function fetchScenarioDetail(id){
  await new Promise(r=>setTimeout(r,400));
  const base = [
    {
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
                { id:"a", text:"Restore systems from backup immediately.",           score:2,  kind:"incorrect" },
                { id:"b", text:"Notify the incident response team and security lead.",score:10, kind:"correct" },
                { id:"c", text:"Delete encrypted files to save storage.",            score:2,  kind:"incorrect" },
                { id:"d", text:"I did not take any action.",                         score:0,  kind:"none" },
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
    },
    // add other scenarios if you want… (we map id -> first entry by default)
  ];
  const item = base[0];
  return item;
}

/* icons */
const IconBack = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
    <path d="M15 6l-6 6 6 6" stroke="#E9EEF5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#cbd6e6" strokeWidth="1.6"/>
    <path d="M12 7v5l3 2" stroke="#cbd6e6" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconSpark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="white" opacity=".92"/>
  </svg>
);

export default function Train(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sc, setSc] = useState(null);          // scenario
  const [answers, setAnswers] = useState({});  // { qid: optionId }
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);         // seconds

  useEffect(()=>{
    let m=true;
    fetchScenarioDetail(id).then(d=>{
      if(!m) return;
      setSc(d);
      setLoading(false);
    });
    const t = setInterval(()=>setTime(s=>s+1),1000);
    return ()=>{ m=false; clearInterval(t); };
  },[id]);

  const flattenQs = useMemo(()=>{
    if(!sc) return [];
    return sc.sections.flatMap(sec => sec.questions.map(q => ({...q, sectionId: sec.id})));
  },[sc]);

  const maxScore = useMemo(()=>{
    return flattenQs.reduce((sum,q)=>sum+Math.max(...q.options.map(o=>o.score)),0);
  },[flattenQs]);

  const score = useMemo(()=>{
    return flattenQs.reduce((sum,q)=>{
      const pick = answers[q.id];
      if(!pick) return sum;
      const opt = q.options.find(o=>o.id===pick);
      return sum + (opt?.score ?? 0);
    },0);
  },[answers, flattenQs]);

  const pct = maxScore ? Math.round((score/maxScore)*100) : 0;
  const elapsed = `${Math.floor(time/60)}:${(time%60).toString().padStart(2,"0")}`;

  const select = (qid, oid) => {
    if(submitted) return;
    setAnswers(a=>({ ...a, [qid]: oid }));
  };

  const submit = () => {
    setSubmitted(true);
    window.scrollTo({top:0, behavior:"smooth"});
  };

  const restart = () => {
    setAnswers({});
    setSubmitted(false);
    setTime(0);
  };

  if(loading) {
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

  if(!sc) return null;

  return (
    <div className="trainX">
      {/* ambient */}
      <div className="bg-blob t-a"/><div className="bg-blob t-b"/><div className="bg-blob t-c"/>

      <div className="container">
        {/* top header */}
        <div className="header glass">
          <button className="btn-ghost" onClick={()=>navigate("/employee")}>
            <span className="ico"><IconBack/></span> Back
          </button>

          <div className="head-mid">
            <div className="spark" style={{background:`linear-gradient(135deg, ${sc.color.from}, ${sc.color.to})`}}>
              <IconSpark/>
            </div>
            <div className="head-txt">
              <h1 className="h-title">{sc.title}</h1>
              <p className="h-sub">
                {sc.tags.join(" • ")} • {sc.est}
              </p>
            </div>
            <span className="pill">{sc.difficulty}</span>
          </div>

          <div className="head-right">
            <div className="timer">
              <IconClock/> <span>{elapsed}</span>
            </div>
            <div className="score">
              <div className="bar">
                <span style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`}}/>
              </div>
              <i>{pct}%</i>
            </div>
          </div>
        </div>

        {/* content layout */}
        <div className="layout">
          {/* sticky outline */}
          <aside className="aside glass">
            <h3 className="aside-title">Outline</h3>
            <ol className="outline">
              {sc.sections.map((sec, si)=>(
                <li key={sec.id}>
                  <span className="dot" style={{background:sc.color.to}}/>
                  <div>
                    <div className="o-title">{sec.title}</div>
                    <div className="o-sub">{sec.questions.length} questions</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="aside-meta">
              <div>Max score</div>
              <b>{maxScore}</b>
            </div>
            <div className="aside-meta">
              <div>Answered</div>
              <b>{Object.keys(answers).length}/{flattenQs.length}</b>
            </div>

            {!submitted ? (
              <button className="btn-glow" style={{background:`linear-gradient(90deg, ${sc.color.from}, ${sc.color.to})`}} onClick={submit}>
                <span className="shine"/>
                Submit answers
              </button>
            ) : (
              <div className="result-box">
                <div className="r-title">Result</div>
                <div className="r-score">{score} / {maxScore}</div>
                <div className="r-pct">{pct}%</div>
                <div className="r-actions">
                  <button className="btn-ghost" onClick={restart}>Restart</button>
                  <button className="btn-ghost" onClick={()=>navigate("/employee")}>Back to list</button>
                </div>
              </div>
            )}
          </aside>

          {/* questions */}
          <main className="main glass">
            {sc.sections.map((sec, si)=>(
              <section key={sec.id} className="sec">
                <div className="sec-head">
                  <div className="spark small" style={{background:`linear-gradient(135deg, ${sc.color.from}, ${sc.color.to})`}}>
                    <IconSpark/>
                  </div>
                  <h2>{sec.title}</h2>
                </div>

                {sec.questions.map((q)=>(
                  <article key={q.id} className="q-card">
                    <div className="q-top">
                      <div className="q-id">Q{q.id.slice(-1)}</div>
                      <div className="q-text">{q.text}</div>
                    </div>

                    <div className="opts">
                      {q.options.map((op)=>{
                        const active = answers[q.id] === op.id;
                        const state =
                          submitted && active ? op.kind : undefined; // show color after submit

                        return (
                          <button
                            key={op.id}
                            className={`opt ${active ? "active":""} ${state ?? ""}`}
                            onClick={()=>select(q.id, op.id)}
                          >
                            <span className="opt-bullet"/>
                            <span>{op.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {q.hint && !submitted && (
                      <div className="hint">Hint: {q.hint}</div>
                    )}

                    {submitted && (
                      <div className="post">
                        <span className="tag">Your score for this question: {q.options.find(o=>o.id===answers[q.id])?.score ?? 0}</span>
                      </div>
                    )}
                  </article>
                ))}
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}