"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { BarChart2, CheckCircle2, AlertCircle, Clock, BookOpen } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";

export default function ProjectDashboard() {
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
        {/* Project Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "0.8rem",
                backgroundColor: "var(--accent-light)",
                color: "var(--accent-color)",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              {activeProject.key}
            </span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{activeProject.name}</h1>
          </div>
          {activeProject.description && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{activeProject.description}</p>
          )}
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {/* Card 1: Open Issues */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#3b82f6" }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Open Issues</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>0</div>
            </div>
          </div>

          {/* Card 2: Completed Issues */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#ecfdf5", color: "#10b981" }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Completed</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>0</div>
            </div>
          </div>

          {/* Card 3: Wiki Pages */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#fef3c7", color: "#f59e0b" }}>
              <BookOpen size={24} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Wiki Pages</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>0</div>
            </div>
          </div>
        </div>

        {/* Section: Activity & Progress */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Project Activity</h2>
            <EmptyState
              title="No activity yet"
              description="Issues, wikis, and uploads will register activity here."
            />
          </div>

          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Progress Chart</h2>
            <div
              style={{
                height: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
              }}
            >
              No data to chart yet
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
