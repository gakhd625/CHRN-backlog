"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  MessageSquare,
  Trash2,
  Edit,
  Send,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import {
  issueRepository,
  projectRepository,
  userRepository,
  Issue,
  Comment,
  ActivityLog,
  ProjectMember,
  User as UserType,
} from "@/services";

export default function IssueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();

  const key = params?.key as string;
  const issueKey = params?.issueKey as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
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

  // New Comment State
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const loadIssueData = async () => {
    if (!key || !issueKey) return;
    try {
      const foundIssue = await issueRepository.getByKey(key, issueKey);
      if (foundIssue) {
        setIssue(foundIssue);

        // Load comments
        const comms = await issueRepository.getComments(foundIssue.id);
        setComments(comms);

        // Load project activities & filter for this issue
        const acts = await projectRepository.getActivity(key);
        const issueActs = acts.filter((a) => a.issueId === foundIssue.id);
        setActivities(issueActs);

        // Load edit form fields
        setTitle(foundIssue.title);
        setDescription(foundIssue.description);
        setAssigneeId(foundIssue.assigneeId || "");
        setStatus(foundIssue.status);
        setPriority(foundIssue.priority);
        setStartDate(foundIssue.startDate || "");
        setDueDate(foundIssue.dueDate || "");
        setCategory(foundIssue.category || "");
        setMilestone(foundIssue.milestone || "");
        setLabelsInput(foundIssue.labels.join(", "));
      } else {
        setIssue(null);
      }

      const membersList = await projectRepository.getMembers(key);
      setMembers(membersList);

      const usersList = await userRepository.getAll();
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to load issue details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadIssueData();
    }
  }, [key, issueKey, activeProject]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser || !issue) return;

    try {
      await issueRepository.addComment({
        issueId: issue.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newCommentText.trim(),
      });
      setNewCommentText("");
      await loadIssueData();
    } catch (err: any) {
      alert(err.message || "Failed to add comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await issueRepository.deleteComment(commentId);
        await loadIssueData();
      } catch (err: any) {
        alert(err.message || "Failed to delete comment.");
      }
    }
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser || !issue) return;

    try {
      const labels = labelsInput
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const updated = {
        ...issue,
        title: title.trim(),
        description: description.trim(),
        assigneeId: assigneeId || undefined,
        status,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        category: category.trim() || undefined,
        milestone: milestone.trim() || undefined,
        labels,
      };

      await issueRepository.update(updated, currentUser.id, currentUser.name);
      setShowEditModal(false);
      alert("Issue updated successfully!");
      await loadIssueData();
    } catch (err: any) {
      alert(err.message || "Failed to update issue.");
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    if (confirm(`Are you sure you want to delete the issue "${issue.key}: ${issue.title}"?`)) {
      try {
        await issueRepository.delete(issue.id);
        alert("Issue deleted successfully.");
        router.push(`/projects/${key}/issues`);
      } catch (err: any) {
        alert(err.message || "Failed to delete issue.");
      }
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

  if (loading) {
    return (
      <MainLayout>
        <LoadingState message="Loading issue details..." />
      </MainLayout>
    );
  }

  if (!issue) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "48px" }}>
          <h2>Issue not found</h2>
          <Link href={`/projects/${key}/issues`} style={{ color: "var(--accent-color)", marginTop: "16px", display: "inline-block" }}>
            Back to Issues List
          </Link>
        </div>
      </MainLayout>
    );
  }

  const assigneeUser = users.find((u) => u.id === issue.assigneeId);
  const reporterUser = users.find((u) => u.id === issue.reporterId);

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        {/* Back Link & Actions Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Link
            href={`/projects/${key}/issues`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Issues</span>
          </Link>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeleteIssue}
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "var(--priority-high)",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Dynamic Details Split Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px" }}>
          {/* Left Column (Content & Thread) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{issue.key}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "8px",
                    color: "#ffffff",
                    backgroundColor: getStatusColor(issue.status),
                  }}
                >
                  {issue.status === "progress" ? "In Progress" : issue.status}
                </span>
              </div>

              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "16px" }}>{issue.title}</h1>
              
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Description</h2>
              <div
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-primary)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {issue.description || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No description provided.</span>}
              </div>
            </div>

            {/* Comments Thread */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={18} style={{ color: "var(--accent-color)" }} />
                <span>Comments ({comments.length})</span>
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                {comments.map((comm) => (
                  <div
                    key={comm.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-color)",
                        color: "var(--text-on-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        overflow: "hidden",
                      }}
                    >
                      {comm.userAvatar ? (
                        <img src={comm.userAvatar} alt={comm.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        comm.userName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{comm.userName}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(comm.createdAt).toLocaleString()}
                          </span>
                          {currentUser?.id === comm.userId && (
                            <button
                              onClick={() => handleDeleteComment(comm.id)}
                              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ marginTop: "6px", fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} style={{ display: "flex", gap: "10px" }}>
                <textarea
                  required
                  placeholder="Type a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontSize: "0.875rem",
                    resize: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: "var(--accent-color)",
                    color: "var(--text-on-accent)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (Side Card Fields) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                Details
              </h2>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Priority</span>
                <span style={{ fontWeight: 600, color: getPriorityColor(issue.priority), textTransform: "capitalize", fontSize: "0.875rem" }}>
                  {issue.priority}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Assignee</span>
                {assigneeUser ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
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
                      {assigneeUser.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{assigneeUser.name}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Unassigned</span>
                )}
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Reporter</span>
                {reporterUser ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        fontWeight: 600,
                      }}
                    >
                      {reporterUser.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{reporterUser.name}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Unknown</span>
                )}
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Start Date</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{issue.startDate ? new Date(issue.startDate).toLocaleDateString() : "--"}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Due Date</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "--"}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Category</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{issue.category || "--"}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Milestone</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{issue.milestone || "--"}</span>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Labels</span>
                {issue.labels.length > 0 ? (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {issue.labels.map((l, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.7rem",
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
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>--</span>
                )}
              </div>
            </div>

            {/* Issue Specific History */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "12px" }}>
                History
              </h2>
              {activities.length === 0 ? (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>No edit history.</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto" }}>
                  {activities.map((act) => (
                    <div key={act.id} style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                      <strong style={{ color: "var(--text-primary)" }}>{act.userName}</strong> {act.details.replace(`issue ${issue.key}`, "")}
                      <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "2px" }}>
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Issue Modal */}
      {showEditModal && (
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
            onSubmit={handleUpdateIssue}
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
              Edit Issue Details
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
                onClick={() => setShowEditModal(false)}
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
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
}
