// src/pages/DepartmentManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./UserManagement.css";
import "./Admin.css";

export default function DepartmentManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      setError(null);
      const { data } = await api.get("/api/department");
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load departments", err);
      setError("Could not load departments. Please try again.");
      setDepartments([]);
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

      await api.post("/api/department", { name: formData.name.trim() });
      setFlash({ type: "success", message: "Department created successfully" });
      setShowCreateModal(false);
      setFormData({ name: "" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to create department" });
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name });
    setShowCreateModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (!formData.name.trim()) {
        setFlash({ type: "error", message: "Name is required" });
        return;
      }

      await api.put(`/api/department/${editingDept.id}`, { name: formData.name.trim() });
      setFlash({ type: "success", message: "Department updated successfully" });
      setShowCreateModal(false);
      setEditingDept(null);
      setFormData({ name: "" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to update department" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department? Users must be reassigned first.")) {
      return;
    }

    try {
      await api.delete(`/api/department/${id}`);
      setFlash({ type: "success", message: "Department deleted successfully" });
      await loadData();
    } catch (err) {
      setFlash({ type: "error", message: err.response?.data?.message || "Failed to delete department" });
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
        <h1 className="page-title">Department Management</h1>
        <p className="page-subtitle">Manage departments and organize users</p>

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
            <h3>Departments ({departments.length})</h3>
            <button className="btn-primary" onClick={() => {
              setEditingDept(null);
              setFormData({ name: "" });
              setShowCreateModal(true);
            }}>
              + Create Department
            </button>
          </div>

          {departments.length === 0 ? (
            <div className="empty">No departments found. Create one to get started.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td><b>{dept.name}</b></td>
                      <td>{dept.userCount || 0}</td>
                      <td>
                        <button className="btn-ghost" onClick={() => handleEdit(dept)}>Edit</button>
                        <button className="btn-ghost" onClick={() => handleDelete(dept.id)} style={{ marginLeft: 8, color: "#ef4444" }}>
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
          setEditingDept(null);
          setFormData({ name: "" });
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingDept ? "Edit Department" : "Create Department"}</h3>
            <div style={{ marginTop: 16 }}>
              <label className="label">Name</label>
              <input
                className="input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Department name"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn-outlined" onClick={() => {
                setShowCreateModal(false);
                setEditingDept(null);
                setFormData({ name: "" });
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={editingDept ? handleUpdate : handleCreate}>
                {editingDept ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

