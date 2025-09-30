export default function App(){
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
        <h1>Incident Response Plan</h1>
        <p className="muted">Træn rolle-baserede procedurer, og få målelig feedback og dokumentation.</p>

        <section className="grid grid-3" style={{marginTop: 24}}>
          <article className="card">
            <h3>Scenarier</h3>
            <p className="muted">Vælg et scenarie og gennemfør trinene efter din rolle.</p>
          </article>
          <article className="card">
            <h3>Score & feedback</h3>
            <p className="muted">Se hvad der manglede, og hvor I kan forbedre processen.</p>
          </article>
          <article className="card">
            <h3>Compliance</h3>
            <p className="muted">Dokumentér træning og evaluering til audits og læring.</p>
          </article>
        </section>
      </div>
    </>
  );
}
