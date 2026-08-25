"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Upload, FolderPlus } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";

export default function FilesPage() {
  const params = useParams();
  const { activeProject, setActiveProjectKey } = useApp();
  const key = params?.key as string;

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  if (!activeProject) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "48px" }}>
          <h2>Project not found</h2>
        </div>
      </MainLayout>
    );
  }

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
              <FileText style={{ color: "var(--accent-color)" }} />
              <span>Files</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Upload and organize files, diagrams, and document attachments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
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
              <FolderPlus size={16} />
              <span>New Folder</span>
            </button>
            <button
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
              <Upload size={16} />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        <EmptyState
          title="No files yet"
          description="Upload project plans, design mocks, or code templates."
          actionText="Upload File"
          onAction={() => alert("File upload will be implemented in Phase 9")}
          icon={FileText}
        />
      </div>
    </MainLayout>
  );
}
