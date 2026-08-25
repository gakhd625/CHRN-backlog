"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus, ArrowRight, MessageSquare, Info } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp, Project } from "@/context/AppContext";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, addProject, setActiveProjectKey } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projKey, setProjKey] = useState("");
  const [projDesc, setProjDesc] = useState("");

  const handleSelectProject = (key: string) => {
    setActiveProjectKey(key);
    router.push(`/projects/${key}`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projKey.trim()) return;

    try {
      const created = await addProject({
        key: projKey.toUpperCase().trim(),
        name: projName.trim(),
        description: projDesc.trim(),
      });

      setActiveProjectKey(created.key);
      
      // Reset form
      setProjName("");
      setProjKey("");
      setProjDesc("");
      setShowModal(false);

      router.push(`/projects/${created.key}`);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    }
  };

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
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Projects</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Manage and view all your active projects.
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
            <span>Create Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px dashed var(--border-hover)",
              borderRadius: "12px",
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Folder size={48} style={{ color: "var(--text-muted)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              No projects yet
            </h3>
            <p style={{ fontSize: "0.9rem", marginBottom: "24px" }}>
              Create your first project to start tracking issues, board, wiki, and repository files.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--text-on-accent)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get Started
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleSelectProject(proj.key)}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "160px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-color)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "var(--accent-light)",
                        color: "var(--accent-color)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      {proj.key}
                    </span>
                    <Folder size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>
                    {proj.name}
                  </h2>
                  {proj.description && (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineBreak: "anywhere", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {proj.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "12px",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Info size={12} />
                    Local-first
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--accent-color)",
                      fontWeight: 600,
                    }}
                  >
                    Open Project
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
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
            onSubmit={handleCreateProject}
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", color: "var(--text-primary)" }}>
              Create New Project
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Project Name *
              </label>
              <input
                type="text"
                required
                value={projName}
                onChange={(e) => {
                  setProjName(e.target.value);
                  if (!projKey) {
                    const words = e.target.value.split(" ");
                    const keyVal = words.map(w => w[0]).join("").substring(0, 5).toUpperCase();
                    setProjKey(keyVal.replace(/[^A-Z]/g, ""));
                  }
                }}
                placeholder="e.g., Backlog Redesign"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Project Key * (Short identifier, capital letters)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={projKey}
                onChange={(e) => setProjKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                placeholder="e.g., BACKLOG"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Description
              </label>
              <textarea
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Short project overview"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "none",
                }}
              />
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
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--accent-color)",
                  color: "var(--text-on-accent)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
}
