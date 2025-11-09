// client/src/pages/Scenarios.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Scenarios() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError(null);
        const { data } = await api.get("/api/scenarios");
        if (!active) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch scenarios", err);
        if (!active) return;
        setItems([]);
        setError("Kunde inte hämta scenarier just nu.");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h2>Scenarier</h2>
      {error && <p className="muted">{error}</p>}
      <div className="grid grid-3">
        {items.map((s) => (
          <article key={s.id} className="card">
            <h3>{s.title}</h3>
            <p className="muted">{s.description}</p>
          </article>
        ))}
        {items.length === 0 && !error && <p className="muted">Inga scenarier hittades.</p>}
      </div>
    </section>
  );
}
