"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users, Plus, Trash2, Edit3, X, UserCheck, Shield } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import { projectRepository, userRepository, ProjectMember, User } from "@/services";

export default function MembersPage() {
  const params = useParams();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Developer");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const loadMembers = async () => {
    if (!key) return;
    try {
      const list = await projectRepository.getMembers(key);
      setMembers(list);

      const usersList = await userRepository.getAll();
      setAllUsers(usersList);
    } catch (err) {
      console.error("Failed to load project members", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadMembers();
    }
  }, [key, activeProject]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !key) return;

    try {
      await projectRepository.addMember(key, selectedUserId, selectedRole);
      await loadMembers();
      setSelectedUserId("");
      setSelectedRole("Developer");
      setShowModal(false);
      alert("Member added to project successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to add member.");
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await projectRepository.updateMemberRole(memberId, role);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || "Failed to update member role.");
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (currentUser && currentUser.id === member.userId) {
      alert("You cannot remove yourself from the project.");
      return;
    }

    if (confirm(`Are you sure you want to remove ${member.userName} from this project?`)) {
      try {
        await projectRepository.removeMember(key, member.id);
        await loadMembers();
        alert("Member removed successfully.");
      } catch (err: any) {
        alert(err.message || "Failed to remove member.");
      }
    }
  };

  if (!activeProject) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "48px" }}>
          <h2>Project not found</h2>
        </div>
      </MainLayout>
    );
  }

  // Filter out users who are already members
  const availableUsers = allUsers.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Users style={{ color: "var(--accent-color)" }} />
              <span>Project Members</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Manage users who can view, create, or update issues on this project.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: "var(--accent-color)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading members..." />
        ) : (
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-primary)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-color)",
                        color: "var(--text-on-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        overflow: "hidden",
                      }}
                    >
                      {member.userAvatar ? (
                        <img src={member.userAvatar} alt={member.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        member.userName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                        {member.userName} {currentUser?.id === member.userId && "(You)"}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {member.userEmail}
                      </p>
                      
                      {/* Role selection toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                        <Shield size={12} style={{ color: "var(--accent-color)" }} />
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--accent-color)",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Manager">Manager</option>
                          <option value="Developer">Developer</option>
                          <option value="Reporter">Reporter</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {currentUser?.id !== member.userId && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--priority-high)";
                        e.currentTarget.style.backgroundColor = "#fee2e2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleAddMember}
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "440px",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserCheck size={20} style={{ color: "var(--accent-color)" }} />
                <span>Add Project Member</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {availableUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                All registered users are already members of this project.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                    Select User *
                  </label>
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="">Choose User...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                    Project Role *
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Reporter">Reporter</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedUserId}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: selectedUserId ? "var(--accent-color)" : "var(--border-color)",
                      color: "var(--text-on-accent)",
                      cursor: selectedUserId ? "pointer" : "not-allowed",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </MainLayout>
  );
}
