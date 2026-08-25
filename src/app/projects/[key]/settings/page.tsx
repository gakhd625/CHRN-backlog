"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, Trash2, Save } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import { projectRepository } from "@/services";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, refreshProjects } = useApp();
  const key = params?.key as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      setDescription(activeProject.description || "");
    }
  }, [activeProject]);

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

  return (
    <MainLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings style={{ color: "var(--accent-color)" }} />
            <span>Project Settings</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Configure project parameters, details, or delete project.
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
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-muted)",
                  outline: "none",
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
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
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
