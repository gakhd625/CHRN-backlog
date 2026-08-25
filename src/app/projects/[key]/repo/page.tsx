"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { GitBranch, Terminal } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";

export default function RepositoryPage() {
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
              <GitBranch style={{ color: "var(--accent-color)" }} />
              <span>Git Repository</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Browse branches, commit history, file changes, and diffs.
            </p>
          </div>
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
            <Terminal size={16} />
            <span>Connect Repository</span>
          </button>
        </div>

        <EmptyState
          title="No repository connected"
          description="Initialize or connect a local Git repository to begin browsing source files and commits."
          actionText="Connect Local Git"
          onAction={() => alert("Git Integration will be implemented in Phase 11")}
          icon={GitBranch}
        />
      </div>
    </MainLayout>
  );
}
