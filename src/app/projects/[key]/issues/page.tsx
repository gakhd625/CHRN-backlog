"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ListTodo, Plus, Search, Filter, Calendar, User, Tag, Clock } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { issueRepository, projectRepository, Issue, ProjectMember } from "@/services";

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<"open" | "progress" | "resolved" | "closed">("open");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [milestone, setMilestone] = useState("");
  const [labelsInput, setLabelsInput] = useState("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const loadData = async () => {
    if (!key) return;
    try {
      const issueList = await issueRepository.getByProject(key);
      setIssues(issueList);

      const membersList = await projectRepository.getMembers(key);
      setMembers(membersList);
    } catch (err) {
      console.error("Failed to load issues", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadData();
    }
  }, [key, activeProject]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser || !key) return;

    try {
      const labels = labelsInput
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      await issueRepository.create({
        projectId: activeProject?.id || `proj-${key}`,
        projectKey: key,
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || undefined,
        reporterId: currentUser.id,
        status,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        category: category.trim() || undefined,
        milestone: milestone.trim() || undefined,
        labels,
        attachments: [],
      });

      // Clear Form
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setStatus("open");
      setPriority("medium");
      setStartDate("");
      setDueDate("");
      setCategory("");
      setMilestone("");
      setLabelsInput("");
      setShowModal(false);

      alert("Issue created successfully!");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create issue.");
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "open":
        return "var(--status-open)";
      case "progress":
        return "var(--status-in-progress)";
      case "resolved":
        return "var(--status-resolved)";
      case "closed":
        return "var(--status-closed)";
      default:
        return "var(--text-muted)";
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "var(--priority-high)";
      case "medium":
        return "var(--priority-medium)";
      case "low":
        return "var(--priority-low)";
      default:
        return "var(--text-muted)";
    }
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

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <ListTodo style={{ color: "var(--accent-color)" }} />
              <span>Issues</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Track tasks, bugs, and improvements for this project.
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
            <span>Add Issue</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            gap: "12px",
            alignItems: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search issues by name, description, key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 38px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                outline: "none",
                fontSize: "0.875rem",
              }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading issues..." />
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No search results match" : "No issues found"}
            description={searchQuery ? "Try checking spelling or using broader keywords." : "Create your first issue to plan and assign tasks."}
            actionText={searchQuery ? undefined : "Create Issue"}
            onAction={searchQuery ? undefined : () => setShowModal(true)}
            icon={ListTodo}
          />
        ) : (
          /* Premium Table View */
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)", width: "120px" }}>Key</th>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>Title</th>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)", width: "120px" }}>Status</th>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)", width: "100px" }}>Priority</th>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)", width: "160px" }}>Assignee</th>
                  <th style={{ padding: "16px", fontWeight: 600, color: "var(--text-secondary)", width: "120px" }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => {
                  const assignee = members.find((m) => m.userId === issue.assigneeId);
                  return (
                    <tr
                      key={issue.id}
                      style={{ borderBottom: "1px solid var(--border-color)", cursor: "pointer", transition: "background-color 0.2s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => router.push(`/projects/${key}/issues/${issue.key}`)}
                    >
                      <td style={{ padding: "16px", fontWeight: 700, color: "var(--accent-color)" }}>
                        {issue.key}
                      </td>
                      <td style={{ padding: "16px", fontWeight: 500, color: "var(--text-primary)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span>{issue.title}</span>
                          {issue.labels.length > 0 && (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                              {issue.labels.map((l, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: "0.7rem",
                                    backgroundColor: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 500,
                                    border: "1px solid var(--border-color)",
                                  }}
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: "12px",
                            color: "#ffffff",
                            backgroundColor: getStatusColor(issue.status),
                            textTransform: "uppercase",
                          }}
                        >
                          {issue.status === "progress" ? "In Progress" : issue.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ fontWeight: 600, color: getPriorityColor(issue.priority), textTransform: "capitalize" }}>
                          {issue.priority}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "var(--text-secondary)" }}>
                        {assignee ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: "var(--accent-color)",
                                color: "var(--text-on-accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            >
                              {assignee.userName.substring(0, 2).toUpperCase()}
                            </div>
                            <span>{assignee.userName}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "16px", color: "var(--text-secondary)" }}>
                        {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Issue Modal */}
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
            padding: "20px",
          }}
        >
          <form
            onSubmit={handleCreateIssue}
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", color: "var(--text-primary)" }}>
              Create New Issue
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Issue Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
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
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation, steps to reproduce, or notes..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.userName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="open">Open</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Labels (comma-separated)
                </label>
                <input
                  type="text"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="e.g. bug, UI, marketing"
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Documentation"
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

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Milestone / Version
                </label>
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  placeholder="e.g. v1.0-beta"
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
