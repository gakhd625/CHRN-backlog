"use client";

import React, { useEffect } from "react";
import { Terminal, RotateCcw, Database } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import { resetLocalStorageData, issueRepository, projectRepository } from "@/services";

export default function DevToolsPage() {
  const { setActiveProjectKey } = useApp();

  useEffect(() => {
    setActiveProjectKey(null); // Clear active project scope on global dev tools
  }, [setActiveProjectKey]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all backlog clone local data? This will clear all projects, issues, comments, wikis, and log you out.")) {
      resetLocalStorageData();
      alert("Local storage wiped successfully. Reloading...");
      window.location.href = "/";
    }
  };

  const handleSeed = async () => {
    if (confirm("This will seed a sample project with mock issues, wikis, and comments. Proceed?")) {
      try {
        // 1. Wipe existing first
        resetLocalStorageData();

        // 2. Create sample project
        const project = await projectRepository.create({
          key: "DEMO",
          name: "ChronoBacklog Demo Project",
          description: "Sample workspace containing pre-seeded tasks and wiki entries.",
        });

        // 3. Create sample issues
        const issue1 = await issueRepository.create({
          projectId: "proj-demo",
          projectKey: "DEMO",
          title: "Initialize Next.js application structure",
          description: "Setup folder tree, App Router layouts, and design system color variables.",
          assigneeId: "user-1",
          reporterId: "user-1",
          status: "closed",
          priority: "high",
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // +3 days
          labels: ["engineering", "setup"],
          attachments: [],
        });

        const issue2 = await issueRepository.create({
          projectId: "proj-demo",
          projectKey: "DEMO",
          title: "Implement local-first persistence layer",
          description: "Write repository design interfaces and local-storage implementations.",
          assigneeId: "user-1",
          reporterId: "user-1",
          status: "progress",
          priority: "high",
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // +7 days
          labels: ["engineering", "database"],
          attachments: [],
        });

        const issue3 = await issueRepository.create({
          projectId: "proj-demo",
          projectKey: "DEMO",
          title: "Support collaborative comments and activity tracking",
          description: "Provide history audits, comment updates, and dashboard activity streams.",
          assigneeId: undefined,
          reporterId: "user-1",
          status: "open",
          priority: "medium",
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], // +14 days
          labels: ["collaboration"],
          attachments: [],
        });

        // 4. Add comments
        await issueRepository.addComment({
          issueId: issue1.id,
          userId: "user-1",
          userName: "Gerly",
          content: "Next.js structure created successfully. Built cleanly on check.",
        });

        await issueRepository.addComment({
          issueId: issue2.id,
          userId: "user-1",
          userName: "Gerly",
          content: "Completed interfaces. Currently integrating with AppContext.",
        });

        alert("Database seeded successfully! Reloading...");
        // Set active project key
        localStorage.setItem("bl_active_project_key", "DEMO");
        window.location.href = "/projects/DEMO";
      } catch (err: any) {
        alert(err.message || "Failed to seed demo data");
      }
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal style={{ color: "var(--accent-color)" }} />
            <span>Developer Tools</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Utility tools for seeding, resetting, and inspecting local storage state.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Card 1: Reset */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <RotateCcw size={18} style={{ color: "var(--priority-high)" }} />
                <span>Reset Database</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "24px" }}>
                Completely erase all local storage entries. All custom projects, issues, comments, and settings will be permanently removed.
              </p>
            </div>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: "var(--priority-high)",
                color: "var(--text-on-accent)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Wipe Local Storage
            </button>
          </div>

          {/* Card 2: Seed */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Database size={18} style={{ color: "var(--accent-color)" }} />
                <span>Seed Mock Data</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "24px" }}>
                Seed your local database with a demo project (`DEMO`), multiple issues at various status stages, comments, and task checklists.
              </p>
            </div>
            <button
              onClick={handleSeed}
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--text-on-accent)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Seed Demo Database
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
