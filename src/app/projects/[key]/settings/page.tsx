"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Trash2, Save, Plus, X, GripVertical, Palette } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import { projectRepository, workflowRepository, StatusConfig } from "@/services";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, refreshProjects } = useApp();
  const key = params?.key as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Workflow statuses
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#6366f1");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      setDescription(activeProject.description || "");
      loadStatuses();
    }
  }, [activeProject]);

  const loadStatuses = async () => {
    if (!key) return;
    const list = await workflowRepository.getStatuses(key);
    setStatuses(list);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await projectRepository.update({
        ...activeProject,
        name: name.trim(),
        description: description.trim(),
      });
      await refreshProjects();
      alert("Project settings updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update project settings");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete the project "${activeProject.name}"? This action is permanent and cannot be undone.`
      )
    ) {
      try {
        await projectRepository.delete(activeProject.key);
        await refreshProjects();
        setActiveProjectKey(null);
        alert("Project deleted successfully.");
        window.location.href = "/";
      } catch (err: any) {
        alert(err.message || "Failed to delete project");
      }
    }
  };

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim() || !key) return;
    try {
      await workflowRepository.addStatus({
        projectId: key,
        name: newStatusName.trim(),
        color: newStatusColor,
        order: statuses.length,
      });
      setNewStatusName("");
      setNewStatusColor("#6366f1");
      await loadStatuses();
    } catch (err: any) {
      alert(err.message || "Failed to add status.");
    }
  };

  const handleRemoveStatus = async (statusId: string) => {
    if (!confirm("Remove this status? Issues using it will need manual reassignment.")) return;
    try {
      await workflowRepository.removeStatus(key, statusId);
      await loadStatuses();
    } catch (err: any) {
      alert(err.message || "Failed to remove status.");
    }
  };

  const handleMoveStatus = async (index: number, direction: "up" | "down") => {
    const newOrder = [...statuses];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[index]];
    const ids = newOrder.map((s) => s.id);
    await workflowRepository.reorderStatuses(key, ids);
    await loadStatuses();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings style={{ color: "var(--accent-color)" }} />
            <span>Project Settings</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Configure project parameters, workflow statuses, or delete project.
          </p>
        </div>

        {/* General Form */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Project Key
              </label>
              <input
                type="text"
                disabled
                value={activeProject.key}
                style={{
                  ...inputStyle,
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-muted)",
                  cursor: "not-allowed",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                Project keys are set at creation and cannot be modified.
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--text-on-accent)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Workflow Configuration */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Palette size={18} style={{ color: "var(--accent-color)" }} />
            <span>Workflow Statuses</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Define the issue statuses and their order in the workflow pipeline. The default flow is Open → In Progress → Resolved → Closed.
          </p>

          {/* Existing Statuses List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {statuses.map((status, index) => (
              <div
                key={status.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <button
                    onClick={() => handleMoveStatus(index, "up")}
                    disabled={index === 0}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: index === 0 ? "default" : "pointer",
                      color: index === 0 ? "var(--border-color)" : "var(--text-muted)",
                      padding: "0",
                      fontSize: "0.7rem",
                      lineHeight: 1,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveStatus(index, "down")}
                    disabled={index === statuses.length - 1}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: index === statuses.length - 1 ? "default" : "pointer",
                      color: index === statuses.length - 1 ? "var(--border-color)" : "var(--text-muted)",
                      padding: "0",
                      fontSize: "0.7rem",
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </button>
                </div>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    backgroundColor: status.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>{status.name}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Order: {index}</span>
                <button
                  onClick={() => handleRemoveStatus(status.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--priority-high)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Status Form */}
          <form onSubmit={handleAddStatus} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-secondary)" }}>
                New Status Name
              </label>
              <input
                type="text"
                required
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g. QA Review"
                style={{ ...inputStyle, fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ width: "60px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-secondary)" }}>
                Color
              </label>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  padding: "2px",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--text-on-accent)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--priority-high)", marginBottom: "8px" }}>
            Danger Zone
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
            Deleting the project will permanently erase all associated issues, wiki pages, files, comments, and repository settings stored locally.
          </p>
          <button
            onClick={handleDelete}
            style={{
              backgroundColor: "var(--priority-high)",
              color: "var(--text-on-accent)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Trash2 size={16} />
            <span>Delete Project</span>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
