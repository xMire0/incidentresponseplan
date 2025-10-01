// client/src/components/Footer.jsx
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} Incident Response Trainer</p>
        <p className="muted">
          Proof-of-concept til træning, scoring og compliance-dokumentation.
        </p>
      </div>
    </footer>
  );
}
