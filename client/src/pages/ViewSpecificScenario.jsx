// src/pages/ViewSpecificScenario.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./ViewSpecificScenario.css";

export default function ViewSpecificScenario(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    // Mock fetch: replace with real API call /api/scenarios/:id
    const mock = {
      id,
      title: "Ransomware Detected",
      risk: "Medium",
      tags: ["Security","IR"],
      est: "15–20 min",
      maxScore: 50,
      sections: 2,
      questions: 5,
      updatedAt: "2025-10-20T14:12:00Z",
      description: "Simulates a ransomware incident impacting production endpoints."
    };
    setScenario(mock);
  }, [id]);

  const save = () => {
    // TODO: POST/PUT to API
    setEditing(false);
  };

  if (!scenario) return <div className="loading">Loading…</div>;

  return (
    <div className="specific-root">
      <div className="specific-topbar">
        <button className="btn-outlined" onClick={()=>navigate("/admin/scenarios")}>← Back</button>
        <div style={{display:"flex",gap:8}}>
          {!editing ? (
            <button className="btn-primary" onClick={()=>setEditing(true)}>Edit</button>
          ) : (
            <button className="btn-primary" onClick={save}>Save changes</button>
          )}
        </div>
      </div>

      <div className="specific-content">
        {!editing ? (
          <>
            <h1>{scenario.title}</h1>
            <p className="muted">ID: {scenario.id}</p>

            <div className="info-grid">
              <div><b>Risk:</b> <span className="pill">{scenario.risk}</span></div>
              <div><b>Tags:</b> {scenario.tags.join(", ")}</div>
              <div><b>Estimated time:</b> {scenario.est}</div>
              <div><b>Max score:</b> {scenario.maxScore}</div>
              <div><b>Sections:</b> {scenario.sections}</div>
              <div><b>Questions:</b> {scenario.questions}</div>
              <div><b>Last updated:</b> {new Date(scenario.updatedAt).toLocaleString()}</div>
            </div>

            <div className="description-box">
              <h3>Description</h3>
              <p>{scenario.description}</p>
            </div>
          </>
        ) : (
          <>
            <h1>Edit scenario</h1>
            <div className="form-grid">
              <label>Title
                <input className="input" value={scenario.title}
                  onChange={e=>setScenario(s=>({...s,title:e.target.value}))} />
              </label>

              <label>Risk
                <select className="input" value={scenario.risk}
                  onChange={e=>setScenario(s=>({...s,risk:e.target.value}))}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </label>

              <label>Tags (comma separated)
                <input className="input" value={scenario.tags.join(", ")}
                  onChange={e=>setScenario(s=>({...s,tags:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)}))} />
              </label>

              <label>Estimated time
                <input className="input" value={scenario.est}
                  onChange={e=>setScenario(s=>({...s,est:e.target.value}))} />
              </label>

              <label>Max score
                <input type="number" className="input" value={scenario.maxScore}
                  onChange={e=>setScenario(s=>({...s,maxScore:Number(e.target.value||0)}))} />
              </label>

              <label>Sections
                <input type="number" className="input" value={scenario.sections}
                  onChange={e=>setScenario(s=>({...s,sections:Number(e.target.value||0)}))} />
              </label>

              <label>Questions
                <input type="number" className="input" value={scenario.questions}
                  onChange={e=>setScenario(s=>({...s,questions:Number(e.target.value||0)}))} />
              </label>

              <label>Description
                <textarea className="input" rows={6} value={scenario.description}
                  onChange={e=>setScenario(s=>({...s,description:e.target.value}))} />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
