"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, AlertCircle, BookOpen, Clock } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { projectRepository, issueRepository, wikiRepository, ActivityLog } from "@/services";

export default function ProjectDashboard() {
  const params = useParams();
  const { activeProject, setActiveProjectKey } = useApp();
  const key = params?.key as string;

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0, wiki: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!key) return;
      try {
        const actList = await projectRepository.getActivity(key);
        setActivities(actList);

        const issueList = await issueRepository.getByProject(key);
        const open = issueList.filter((i) => i.status !== "closed").length;
        const closed = issueList.filter((i) => i.status === "closed").length;

        const wikiList = await wikiRepository.getByProject(key);

        setCounts({
          open,
          closed,
          wiki: wikiList.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    }

    if (activeProject) {
      loadDashboardData();
    }
  }, [key, activeProject]);

  if (!activeProject) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "48px" }}>
          <h2>Project not found</h2>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingState message="Loading dashboard statistics..." />
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
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>{counts.open}</div>
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
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>{counts.closed}</div>
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
              <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "2px" }}>{counts.wiki}</div>
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
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Project Activity</h2>
            
            {activities.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Issues, wikis, and uploads will register activity here."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      fontSize: "0.875rem",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--accent-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Clock size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        <span style={{ fontWeight: 600 }}>{act.userName}</span> {act.details}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "inline-block" }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              {counts.open + counts.closed > 0 ? (
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.75rem" }}>
                    <span>Progress</span>
                    <span>{Math.round((counts.closed / (counts.open + counts.closed)) * 100)}%</span>
                  </div>
                  <div style={{ height: "12px", width: "100%", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(counts.closed / (counts.open + counts.closed)) * 100}%`,
                        backgroundColor: "var(--status-resolved)",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "16px", fontSize: "0.75rem", justifyContent: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--status-open)" }} />
                      Open ({counts.open})
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--status-resolved)" }} />
                      Closed ({counts.closed})
                    </span>
                  </div>
                </div>
              ) : (
                "No data to chart yet"
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
