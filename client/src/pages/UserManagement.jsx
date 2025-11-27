// src/pages/UserManagement.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./UserManagement.css";

export default function UserManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      setError(null);
      const usersRes = await api.get("/api/user");
      let rolesRes = { data: [] };
      try {
        rolesRes = await api.get("/api/role");
      } catch (err) {
        console.warn("Roles endpoint not available", err);
      }
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (err) {
      console.error("Failed to load users", err);
      setError("Could not load users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    try {
      await api.post("/api/user", formData);
      setFlash({ type: "ok", text: "User created successfully." });
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Failed to create user", err);
      setFlash({ type: "err", text: "Failed to create user." });
    } finally {
      setTimeout(() => setFlash(null), 1600);
    }
  };

  const handleEdit = async () => {
    try {
      await api.put(`/api/user/${editingUser.id}`, formData);
      setFlash({ type: "ok", text: "User updated successfully." });
      setEditingUser(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Failed to update user", err);
      setFlash({ type: "err", text: "Failed to update user." });
    } finally {
      setTimeout(() => setFlash(null), 1600);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/api/user/${id}`);
      setFlash({ type: "ok", text: "User deleted successfully." });
      loadData();
    } catch (err) {
      console.error("Failed to delete user", err);
      setFlash({ type: "err", text: "Failed to delete user." });
    } finally {
      setTimeout(() => setFlash(null), 1600);
    }
  };

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", roleId: "" });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      password: "",
      roleId: user.roleId,
    });
  };

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
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-outlined" onClick={() => navigate("/admin")}>
              ← Back to dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container admin-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage users, their roles, and view their progress.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create User
          </button>
        </div>

        {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}
        {error && <div className="flash err">{error}</div>}

        {loading ? (
          <div className="skeleton-panel" />
        ) : users.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          <div className="users-table">
            <div className="users-head">
              <div className="c c1">Username</div>
              <div className="c c2">Email</div>
              <div className="c c3">Role</div>
              <div className="c c4">Actions</div>
            </div>

            {users.map((user) => (
              <div className="users-row" key={user.id}>
                <div className="c c1">
                  <b>{user.username}</b>
                </div>
                <div className="c c2">{user.email || "—"}</div>
                <div className="c c3">
                  <span className="pill">{user.roleName}</span>
                </div>
                <div className="c c4">
                  <button className="btn-ghost" onClick={() => navigate(`/admin/users/${user.id}`)}>
                    View
                  </button>
                  <button className="btn-ghost" onClick={() => openEditModal(user)}>
                    Edit
                  </button>
                  <button className="btn-ghost" onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="modal-backdrop" onClick={() => { setShowCreateModal(false); setEditingUser(null); resetForm(); }}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create User"}</h3>
            <div className="form-group">
              <label>Username</label>
              <input
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password {editingUser && "(leave empty to keep current)"}</label>
              <input
                className="input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                className="input"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-outlined" onClick={() => { setShowCreateModal(false); setEditingUser(null); resetForm(); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={editingUser ? handleEdit : handleCreate}>
                {editingUser ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

