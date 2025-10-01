// client/src/pages/Scenarios.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Scenarios() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/api/scenario").then(r => setItems(r.data));
  }, []);

  return (
    <section>
      <h2>Scenarier</h2>
      <div className="grid grid-3">
        {items.map(s => (
          <article key={s.id} className="card">
            <h3>{s.title}</h3>
            <p className="muted">{s.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
