"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Kanban, Plus, Calendar, Tag, User, GripVertical } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import {
  issueRepository, projectRepository, workflowRepository,
  Issue, ProjectMember, StatusConfig,
} from "@/services";

// Map status config names to internal status keys
function statusNameToKey(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower === "open") return "open";
  if (lower === "in progress") return "progress";
  if (lower === "resolved") return "resolved";
  if (lower === "closed") return "closed";
  // For custom statuses, use the lowercase name as key
  return lower.replace(/\s+/g, "_");
}

export default function KanbanBoardPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Quick add state per column
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const quickAddRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (key) setActiveProjectKey(key);
  }, [key, setActiveProjectKey]);

  const loadData = async () => {
    if (!key) return;
    try {
      const [issueList, membersList, statusList] = await Promise.all([
        issueRepository.getByProject(key),
        projectRepository.getMembers(key),
        workflowRepository.getStatuses(key),
      ]);
      setIssues(issueList);
      setMembers(membersList);
      setStatuses(statusList);
    } catch (err) {
      console.error("Failed to load board data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) loadData();
  }, [key, activeProject]);

  // Focus quick-add input when opened
  useEffect(() => {
    if (quickAddColumn && quickAddRef.current) {
      quickAddRef.current.focus();
    }
  }, [quickAddColumn]);

  // Group issues by status
  const getIssuesForStatus = (statusKey: string): Issue[] => {
    return issues.filter((i) => i.status === statusKey);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    setDraggedIssueId(issueId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragOver = (e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(statusKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatusKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedIssueId || !currentUser) return;

    const issue = issues.find((i) => i.id === draggedIssueId);
    if (!issue || issue.status === targetStatusKey) {
      setDraggedIssueId(null);
      return;
    }

    try {
      const updated = { ...issue, status: targetStatusKey as Issue["status"] };
      await issueRepository.update(updated, currentUser.id, currentUser.name);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to move issue.");
    }

    setDraggedIssueId(null);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverColumn(null);
  };

  // Quick add
  const handleQuickAdd = async (statusKey: string) => {
    if (!quickAddTitle.trim() || !currentUser || !key || !activeProject) return;

    try {
      await issueRepository.create({
        projectId: activeProject.id,
        projectKey: key,
        title: quickAddTitle.trim(),
        description: "",
        assigneeId: undefined,
        reporterId: currentUser.id,
        status: statusKey as Issue["status"],
        priority: "medium",
        startDate: undefined,
        dueDate: undefined,
        category: undefined,
        milestone: undefined,
        labels: [],
        attachments: [],
      });
      setQuickAddTitle("");
      setQuickAddColumn(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create issue.");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "var(--priority-high)";
      case "medium": return "var(--priority-medium)";
      case "low": return "var(--priority-low)";
      default: return "var(--text-muted)";
    }
  };

  if (!activeProject) {
    return <MainLayout><div style={{ textAlign: "center", padding: "48px" }}><h2>Project not found</h2></div></MainLayout>;
  }

  if (loading) {
    return <MainLayout><LoadingState message="Loading board..." /></MainLayout>;
  }

  // Build column definitions from workflow statuses
  const columns = statuses.map((s) => ({
    id: statusNameToKey(s.name),
    name: s.name,
    color: s.color,
  }));

  return (
    <MainLayout>
      <div style={{ maxWidth: "100%", margin: "0 auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }} className="animate-fade-in">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Kanban style={{ color: "var(--accent-color)" }} />
              <span>Board</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>({issues.length} issues)</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Drag and drop cards to change issue status.
            </p>
          </div>
        </div>

        {/* Board Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
            gap: "16px",
            flex: 1,
            overflowX: "auto",
            minHeight: "450px",
            paddingBottom: "16px",
          }}
        >
          {columns.map((col) => {
            const colIssues = getIssuesForStatus(col.id);
            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  backgroundColor: isDropTarget ? "var(--accent-light)" : "var(--bg-secondary)",
                  borderRadius: "12px",
                  border: isDropTarget
                    ? "2px dashed var(--accent-color)"
                    : "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  padding: "12px",
                  transition: "background-color 0.2s ease, border 0.2s ease",
                  minHeight: "300px",
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    borderBottom: `3px solid ${col.color}`,
                    paddingBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{col.name}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600,
                      }}
                    >
                      {colIssues.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setQuickAddColumn(quickAddColumn === col.id ? null : col.id);
                      setQuickAddTitle("");
                    }}
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
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Issue Cards */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
                  {colIssues.map((issue) => {
                    const assignee = members.find((m) => m.userId === issue.assigneeId);
                    const isDragging = draggedIssueId === issue.id;

                    return (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, issue.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push(`/projects/${key}/issues/${issue.key}`)}
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "10px",
                          padding: "14px",
                          cursor: "grab",
                          opacity: isDragging ? 0.4 : 1,
                          transition: "opacity 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
                          boxShadow: isDragging ? "var(--shadow-lg)" : "var(--shadow-sm)",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragging) {
                            e.currentTarget.style.boxShadow = "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1))";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {/* Priority indicator bar */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "8px",
                            bottom: "8px",
                            width: "3px",
                            borderRadius: "0 2px 2px 0",
                            backgroundColor: getPriorityColor(issue.priority),
                          }}
                        />

                        {/* Issue Key */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-color)" }}>
                            {issue.key}
                          </span>
                          <GripVertical size={12} style={{ color: "var(--border-color)" }} />
                        </div>

                        {/* Title */}
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: "10px" }}>
                          {issue.title}
                        </p>

                        {/* Labels */}
                        {issue.labels.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                            {issue.labels.slice(0, 3).map((l, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: "0.65rem",
                                  backgroundColor: "var(--bg-tertiary)",
                                  color: "var(--text-secondary)",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                {l}
                              </span>
                            ))}
                            {issue.labels.length > 3 && (
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>+{issue.labels.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Footer: Assignee, Due Date, Priority */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {assignee ? (
                              <div
                                title={assignee.userName}
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--accent-color)",
                                  color: "var(--text-on-accent)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.6rem",
                                  fontWeight: 600,
                                }}
                              >
                                {assignee.userName.substring(0, 2).toUpperCase()}
                              </div>
                            ) : (
                              <div
                                title="Unassigned"
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "50%",
                                  backgroundColor: "var(--bg-tertiary)",
                                  border: "1px dashed var(--border-color)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <User size={10} style={{ color: "var(--text-muted)" }} />
                              </div>
                            )}
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: getPriorityColor(issue.priority),
                                textTransform: "uppercase",
                              }}
                            >
                              {issue.priority}
                            </span>
                          </div>
                          {issue.dueDate && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              <Calendar size={10} />
                              <span>{new Date(issue.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty column state */}
                  {colIssues.length === 0 && !quickAddColumn && (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px dashed var(--border-color)",
                        borderRadius: "8px",
                        padding: "20px",
                        color: "var(--text-muted)",
                        fontSize: "0.85rem",
                        textAlign: "center",
                      }}
                    >
                      No issues
                    </div>
                  )}

                  {/* Quick Add Input */}
                  {quickAddColumn === col.id && (
                    <div
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--accent-color)",
                        borderRadius: "10px",
                        padding: "12px",
                      }}
                    >
                      <input
                        ref={quickAddRef}
                        type="text"
                        placeholder="Issue title..."
                        value={quickAddTitle}
                        onChange={(e) => setQuickAddTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleQuickAdd(col.id);
                          if (e.key === "Escape") { setQuickAddColumn(null); setQuickAddTitle(""); }
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          outline: "none",
                          fontSize: "0.85rem",
                          marginBottom: "8px",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => { setQuickAddColumn(null); setQuickAddTitle(""); }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleQuickAdd(col.id)}
                          disabled={!quickAddTitle.trim()}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: quickAddTitle.trim() ? "var(--accent-color)" : "var(--border-color)",
                            color: "var(--text-on-accent)",
                            cursor: quickAddTitle.trim() ? "pointer" : "not-allowed",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
