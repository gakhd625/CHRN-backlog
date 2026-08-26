"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  GitCommit as GitCommitIcon,
  User as UserIcon,
  ListTodo,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import {
  projectRepository,
  issueRepository,
  repositoryProvider,
  Issue,
  ProjectMember,
  ActivityLog,
  GitCommit,
} from "@/services";

export default function ProjectDashboard() {
  const params = useParams();
  const { activeProject, setActiveProjectKey } = useApp();
  const key = params?.key as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [recentCommits, setRecentCommits] = useState<GitCommit[]>([]);
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
        const [issueList, memberList, actList, overview] = await Promise.all([
          issueRepository.getByProject(key),
          projectRepository.getMembers(key),
          projectRepository.getActivity(key),
          repositoryProvider.getOverview(key),
        ]);

        setIssues(issueList);
        setMembers(memberList);
        setActivities(actList);
        if (overview) {
          setRecentCommits(overview.latestCommits);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
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
        <LoadingState message="Loading project dashboard & metrics..." />
      </MainLayout>
    );
  }

  // Calculate Metrics from Persisted Data
  const totalCount = issues.length;
  const openCount = issues.filter((i) => i.status === "open").length;
  const progressCount = issues.filter((i) => i.status === "progress").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;
  const closedCount = issues.filter((i) => i.status === "closed").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueCount = issues.filter(
    (i) => i.dueDate && i.dueDate < todayStr && i.status !== "closed"
  ).length;

  const progressPercent =
    totalCount > 0 ? Math.round(((resolvedCount + closedCount) / totalCount) * 100) : 0;

  // Priorities
  const highPriority = issues.filter((i) => i.priority === "high").length;
  const mediumPriority = issues.filter((i) => i.priority === "medium").length;
  const lowPriority = issues.filter((i) => i.priority === "low").length;

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

        {/* 4 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {/* Card 1: Open & Progress */}
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
              <AlertCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Active Issues</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px" }}>{openCount + progressCount}</div>
            </div>
          </div>

          {/* Card 2: Completed */}
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
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Resolved / Closed</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px" }}>{resolvedCount + closedCount}</div>
            </div>
          </div>

          {/* Card 3: Overdue Issues */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: overdueCount > 0 ? "1px solid #fca5a5" : "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: overdueCount > 0 ? "#fee2e2" : "var(--bg-tertiary)", color: overdueCount > 0 ? "var(--priority-high)" : "var(--text-muted)" }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Overdue Issues</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px", color: overdueCount > 0 ? "var(--priority-high)" : "var(--text-primary)" }}>
                {overdueCount}
              </div>
            </div>
          </div>

          {/* Card 4: Overall Progress % */}
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
            <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--accent-light)", color: "var(--accent-color)" }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Overall Completion</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "2px" }}>{progressPercent}%</div>
            </div>
          </div>
        </div>

        {/* Visual Charts: Status & Priority Progress Bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          {/* Status Breakdown Bar */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Status Distribution</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{totalCount} Total</span>
            </div>

            {totalCount > 0 ? (
              <div>
                <div style={{ height: "12px", width: "100%", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", overflow: "hidden", display: "flex", marginBottom: "12px" }}>
                  {openCount > 0 && <div title={`Open: ${openCount}`} style={{ width: `${(openCount / totalCount) * 100}%`, backgroundColor: "#3b82f6" }} />}
                  {progressCount > 0 && <div title={`In Progress: ${progressCount}`} style={{ width: `${(progressCount / totalCount) * 100}%`, backgroundColor: "#f59e0b" }} />}
                  {resolvedCount > 0 && <div title={`Resolved: ${resolvedCount}`} style={{ width: `${(resolvedCount / totalCount) * 100}%`, backgroundColor: "#10b981" }} />}
                  {closedCount > 0 && <div title={`Closed: ${closedCount}`} style={{ width: `${(closedCount / totalCount) * 100}%`, backgroundColor: "#6b7280" }} />}
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }} /> Open ({openCount})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" }} /> Progress ({progressCount})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} /> Resolved ({resolvedCount})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#6b7280" }} /> Closed ({closedCount})</span>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "12px 0" }}>No issues created yet.</div>
            )}
          </div>

          {/* Priority Breakdown Bar */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Priority Distribution</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{totalCount} Total</span>
            </div>

            {totalCount > 0 ? (
              <div>
                <div style={{ height: "12px", width: "100%", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", overflow: "hidden", display: "flex", marginBottom: "12px" }}>
                  {highPriority > 0 && <div title={`High: ${highPriority}`} style={{ width: `${(highPriority / totalCount) * 100}%`, backgroundColor: "var(--priority-high)" }} />}
                  {mediumPriority > 0 && <div title={`Medium: ${mediumPriority}`} style={{ width: `${(mediumPriority / totalCount) * 100}%`, backgroundColor: "var(--priority-medium)" }} />}
                  {lowPriority > 0 && <div title={`Low: ${lowPriority}`} style={{ width: `${(lowPriority / totalCount) * 100}%`, backgroundColor: "var(--priority-low)" }} />}
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--priority-high)" }} /> High ({highPriority})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--priority-medium)" }} /> Medium ({mediumPriority})</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--priority-low)" }} /> Low ({lowPriority})</span>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "12px 0" }}>No issues created yet.</div>
            )}
          </div>
        </div>

        {/* Section: Split Activity Stream & Recent Git Commits */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Recent Activity */}
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
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px" }}>Recent Activity</h2>
            
            {activities.length === 0 ? (
              <EmptyState title="No activity yet" description="Issues, comments, and project changes will show up here." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.85rem",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-color)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {act.userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text-primary)" }}>
                        <strong>{act.userName}</strong> {act.details}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", display: "inline-block" }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Git Commits */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <GitCommitIcon size={18} style={{ color: "var(--accent-color)" }} />
              <span>Recent Git Commits</span>
            </h2>

            {recentCommits.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px 0", textAlign: "center" }}>
                No connected Git repository. Connect local Git or GitHub in Repository tab.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentCommits.slice(0, 4).map((c) => (
                  <div
                    key={c.hash}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.message}</span>
                      <code style={{ fontSize: "0.75rem", color: "var(--accent-color)", backgroundColor: "var(--bg-tertiary)", padding: "1px 6px", borderRadius: "4px" }}>
                        {c.hash}
                      </code>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {c.author} • {new Date(c.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
