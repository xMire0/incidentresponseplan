// src/pages/Admin.jsx
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./admin.css";



export default function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();                               // clear user/token from context + storage
    navigate("/login", { replace: true });  // go back to login
  };

  return (
    <div className="admin-root">
      {/* Topbar */}
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              {/* tiny app mark */}
              <svg viewBox="0 0 24 24" width="24" height="24">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#6b61ff" opacity="0.15" />
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6b61ff" strokeWidth="1.6" />
              </svg>
            </span>
            <span className="brand-name">AdminPro</span>
          </div>

          <button className="btn-outlined" onClick={onLogout}>
            <span className="icon-left" aria-hidden>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 7v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2"
                      stroke="#E9EEF5" strokeWidth="1.6" fill="none"/>
                <path d="M15 12H3m0 0l3-3m-3 3l3 3"
                      stroke="#E9EEF5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </span>
            Log out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container admin-content">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage your scenarios, results, and reports</p>

        <section className="card-grid">
          {/* Create Scenario */}
          <article className="admin-card">
            <div className="card-top">
              <span className="card-icon" style={{ background: "linear-gradient(135deg,#1fb97a,#0ea864)", boxShadow:"0 0 12px rgba(31,185,122,.4)" }}>
                {/* explicit colored icon so it NEVER appears white */}
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <rect x="3" y="3" width="18" height="18" rx="6" fill="#10b981"/>
                  <path d="M12 8v8M8 12h8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              <span className="dot dot-green" />
            </div>

            <h3 className="card-title">Create Scenario</h3>
            <p className="card-desc">
              Create new test scenarios and configure parameters for your simulations
            </p>

            <button className="btn-gradient green" onClick={() => navigate("/admin/create")}>
            Start creation
            </button>
          </article>

          {/* View Results */}
          <article className="admin-card">
            <div className="card-top">
              <span className="card-icon" style={{ background: "linear-gradient(135deg,#3793ff,#1c6dff)", boxShadow:"0 0 12px rgba(55,147,255,.4)" }}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <rect x="3" y="3" width="18" height="18" rx="6" fill="#3b82f6"/>
                  <path d="M7 14v3M12 11v6M17 7v10" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              <span className="dot dot-blue" />
            </div>

            <h3 className="card-title">View Results</h3>
            <p className="card-desc">
              Review and analyze results from your completed test scenarios
            </p>

          
            <button className="btn-gradient blue" onClick={()=>navigate("/admin/results")}>
            Open results
          </button>
          </article>

          {/* Generate Reports */}
          <article className="admin-card">
            <div className="card-top">
              <span className="card-icon" style={{ background: "linear-gradient(135deg,#9a63ff,#6b61ff)", boxShadow:"0 0 12px rgba(154,99,255,.4)" }}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <rect x="3" y="3" width="18" height="18" rx="6" fill="#8b5cf6"/>
                  <path d="M8 8h8v8H8z" stroke="#ffffff" strokeWidth="1.8" fill="none"/>
                </svg>
              </span>
              <span className="dot dot-purple" />
            </div>

            <h3 className="card-title">Generate Reports</h3>
            <p className="card-desc">
              Generate detailed reports and export data for further analysis
            </p>

            <button className="btn-gradient purple">Generate report</button>
          </article>
        </section>
      </div>
    </div>
  );
}