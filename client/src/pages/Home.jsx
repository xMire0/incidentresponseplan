// client/src/pages/Home.jsx
export default function Home() {
  return (
    <section style={{ marginTop: 24 }}>
      <article className="card">
        <h3>Scenarier</h3>
        <p className="muted">Vælg et scenarie og gennemfør trinene efter din rolle.</p>
      </article>
      <article className="card">
        <h3>Score &amp; feedback</h3>
        <p className="muted">Se hvad der manglede, og hvor I kan forbedre processen.</p>
      </article>
      <article className="card">
        <h3>Compliance</h3>
        <p className="muted">Dokumentér træning og evaluering til audits og læring.</p>
      </article>
    </section>
  );
}
