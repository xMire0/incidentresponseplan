// src/pages/RoleManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./UserManagement.css";
import "./Admin.css";

const SECURITY_CLEARANCE_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Admin", label: "Admin" },
];

export default function RoleManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    securityClearence: "Medium",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      setError(null);
      const { data } = await api.get("/api/role");
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load roles", err);
      setError("Could not load roles. Please try again.");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        setFlash({ type: "error", message: "Name is required" });
        return;
      }

      await api.post("/api/role", {
        name: formData.name.trim(),
        securityClearence: formData.securityClearence,
      });
      setFlash({ type: "success", message: "Role created successfully" });
      setShowCreateModal(false);
      setFormData({ name: "", securityClearence: "Medium" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to create role" });
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      securityClearence: role.securityClearence || "Medium",
    });
    setShowCreateModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!formData.name.trim()) {
        setFlash({ type: "error", message: "Name is required" });
        return;
      }

      await api.put(`/api/role/${editingRole.id}`, {
        name: formData.name.trim(),
        securityClearence: formData.securityClearence,
      });
      setFlash({ type: "success", message: "Role updated successfully" });
      setShowCreateModal(false);
      setEditingRole(null);
      setFormData({ name: "", securityClearence: "Medium" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to update role" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role? Users and questions must be reassigned first.")) {
      return;
    }

    try {
      await api.delete(`/api/role/${id}`);
      setFlash({ type: "success", message: "Role deleted successfully" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to delete role" });
    }
  };

  if (loading) {
    return (
      <div className="admin-root">
        <div className="admin-topbar">
          <div className="admin-topbar-inner">
            <div className="brand">
              <span className="brand-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="#6b61ff" opacity="0.15" />
                  <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6b61ff" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="brand-name">AdminPro</span>
            </div>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>← Back</button>
          </div>
        </div>
        <div className="container">
          <div className="skeleton-panel" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#6b61ff" opacity="0.15" />
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="#6b61ff" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="brand-name">AdminPro</span>
          </div>
          <button className="btn-outlined" onClick={() => navigate("/admin")}>← Back</button>
        </div>
      </div>

      <div className="container">
        <h1 className="page-title">Role Management</h1>
        <p className="page-subtitle">Manage roles and security clearance levels</p>

        {flash && (
          <div className={`flash ${flash.type}`} style={{ marginBottom: 16 }}>
            {flash.message}
          </div>
        )}

        {error && (
          <div className="panel">
            <p className="error">{error}</p>
          </div>
        )}

        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Roles ({roles.length})</h3>
            <button className="btn-primary" onClick={() => {
              setEditingRole(null);
              setFormData({ name: "", securityClearence: "Medium" });
              setShowCreateModal(true);
            }}>
              + Create Role
            </button>
          </div>

          {roles.length === 0 ? (
            <div className="empty">No roles found. Create one to get started.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Security Clearance</th>
                    <th>Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td><b>{role.name}</b></td>
                      <td>{role.securityClearence || "Medium"}</td>
                      <td>{role.userCount || 0}</td>
                      <td>
                        <button className="btn-ghost" onClick={() => handleEdit(role)}>Edit</button>
                        <button className="btn-ghost" onClick={() => handleDelete(role.id)} style={{ marginLeft: 8, color: "#ef4444" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingRole(null);
          setFormData({ name: "", securityClearence: "Medium" });
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRole ? "Edit Role" : "Create Role"}</h3>
            <div style={{ marginTop: 16 }}>
              <label className="label">Name</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Role name"
                autoFocus
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="label">Security Clearance</label>
              <select
                className="input"
                value={formData.securityClearence}
                onChange={(e) => setFormData({ ...formData, securityClearence: e.target.value })}
              >
                {SECURITY_CLEARANCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn-outlined" onClick={() => {
                setShowCreateModal(false);
                setEditingRole(null);
                setFormData({ name: "", securityClearence: "Medium" });
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={editingRole ? handleUpdate : handleCreate}>
                {editingRole ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

