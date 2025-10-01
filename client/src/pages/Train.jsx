import { useState, useEffect } from "react";
import api from "../services/api";

export default function Train() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [incidentId, setIncidentId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Hent scenarier fra API
  useEffect(() => {
    api.get("/Scenario").then(res => setScenarios(res.data));
  }, []);

  const begin = async () => {
    const res = await api.post("/Incident", {
      scenarioId: selectedScenarioId,
    });
    setIncidentId(res.data.id);

    // hent spørgsmål til scenarie
    const qRes = await api.get("/Question");
    setQuestions(qRes.data);
  };

  const save = async (questionId) => {
    if (!incidentId) return;
    await api.post("/Response", {
      incidentId,
      questionId,
      roleId: selectedRoleId,
      answer: answers[questionId],
      answeredAt: new Date().toISOString(),
    });
  };

  const score = async () => {
    const res = await api.post("/Evaluation", {
      incidentId,
    });
    setResult(res.data);
  };

  return (

    <>
      <header className="header">
        <div className="inner">
          <b>Incident Response Training</b>
          <nav style={{display:'flex', gap:12}}>
            <a className="btn ghost" href="/">Home</a>
            <a className="btn primary" href="/train">Start træning</a>
          </nav>
        </div>
      </header>
    
    <div className="container">

      
      <h1>Træning</h1>

      <div className="card grid grid-2">
        <label>
          Scenarie
          <select value={selectedScenarioId} onChange={e => setSelectedScenarioId(e.target.value)}>
            <option value="">– vælg –</option>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>
        <label>
          Rolle
          <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
            <option value="">– vælg –</option>
            <option value="role1">Incident Manager</option>
            <option value="role2">Analyst</option>
            <option value="role3">Communicator</option>
          </select>
        </label>

        <div style={{gridColumn:'1 / -1'}}>
          <button className="btn primary" onClick={begin} disabled={!selectedScenarioId || !selectedRoleId}>
            Start incident
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="grid" style={{marginTop: 24}}>
          {questions.map(q => (
            <article className="card" key={q.id}>
              <h3>{q.text}</h3>
              <input
                className="input"
                placeholder="Dit svar…"
                value={answers[q.id] ?? ""}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              />
              <button className="btn" onClick={() => save(q.id)}>Gem svar</button>
            </article>
          ))}
        </div>
      )}

      {incidentId && (
        <div style={{marginTop: 24}}>
          <button className="btn success" onClick={score}>Beregn score</button>
        </div>
      )}

      {result && (
        <article className="card" style={{marginTop: 24}}>
          <h2>Resultat</h2>
          <p>Score: {result.score}</p>
          <p>Korrekte svar: {result.correctAnswers}</p>
          <p>Manglende trin: {result.missingSteps}</p>
        </article>
      )}
    </div>
    </>
  );
}
