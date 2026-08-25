"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  History,
  Check,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import { wikiRepository, WikiPage } from "@/services";

export default function WikiPageScreen() {
  const params = useParams();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [parentIdInput, setParentIdInput] = useState<string>("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const loadPages = async () => {
    if (!key) return;
    try {
      const list = await wikiRepository.getByProject(key);
      setWikiPages(list);

      // Default select first page if none active
      if (list.length > 0 && !activePageId) {
        setActivePageId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load wiki pages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadPages();
    }
  }, [key, activeProject]);

  const activePage = wikiPages.find((w) => w.id === activePageId);

  const startCreate = () => {
    setEditingPageId(null);
    setTitleInput("");
    setContentInput("");
    setParentIdInput("");
    setIsEditing(true);
  };

  const startEdit = (page: WikiPage) => {
    setEditingPageId(page.id);
    setTitleInput(page.title);
    setContentInput(page.content);
    setParentIdInput(page.parentId || "");
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !key || !currentUser) return;

    try {
      if (editingPageId) {
        // Update existing page
        const existing = wikiPages.find((w) => w.id === editingPageId);
        if (!existing) return;

        const updated = await wikiRepository.update({
          ...existing,
          title: titleInput.trim(),
          content: contentInput,
          parentId: parentIdInput || undefined,
        });

        setIsEditing(false);
        await loadPages();
        setActivePageId(updated.id);
      } else {
        // Create new page
        const created = await wikiRepository.create({
          projectId: key,
          title: titleInput.trim(),
          content: contentInput,
          parentId: parentIdInput || undefined,
          authorId: currentUser.id,
          authorName: currentUser.name,
        });

        setIsEditing(false);
        await loadPages();
        setActivePageId(created.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to save Wiki page.");
    }
  };

  const handleDelete = async (id: string) => {
    const page = wikiPages.find((w) => w.id === id);
    if (confirm(`Are you sure you want to delete the Wiki page "${page?.title}"?`)) {
      try {
        await wikiRepository.delete(id);
        const remaining = wikiPages.filter((w) => w.id !== id);
        setWikiPages(remaining);
        setActivePageId(remaining.length > 0 ? remaining[0].id : null);
        setIsEditing(false);
      } catch (err: any) {
        alert(err.message || "Failed to delete page.");
      }
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

  // Filter pages by search query
  const filteredPages = wikiPages.filter(
    (w) =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group pages by parent-child hierarchy
  const rootPages = filteredPages.filter((w) => !w.parentId);
  const childPages = (parentId: string) => filteredPages.filter((w) => w.parentId === parentId);

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", height: "100%" }} className="animate-fade-in">
        {/* Header */}
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
              <BookOpen style={{ color: "var(--accent-color)" }} />
              <span>Project Wiki</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Centralized project documentation, specifications, and architecture notes.
            </p>
          </div>

          <button
            onClick={startCreate}
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
            <span>New Page</span>
          </button>
        </div>

        {/* Wiki Grid: Sidebar + Viewer/Editor */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", minHeight: "550px" }}>
          {/* Left Navigation Sidebar */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 8px 8px 32px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {loading ? (
                <LoadingState message="Loading pages..." />
              ) : rootPages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No wiki pages created yet.
                </div>
              ) : (
                rootPages.map((root) => {
                  const children = childPages(root.id);
                  const isSelected = activePageId === root.id && !isEditing;

                  return (
                    <div key={root.id} style={{ display: "flex", flexDirection: "column" }}>
                      <button
                        onClick={() => {
                          setActivePageId(root.id);
                          setIsEditing(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: isSelected ? "var(--accent-light)" : "transparent",
                          color: isSelected ? "var(--accent-color)" : "var(--text-primary)",
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "0.875rem",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        <FileText size={16} style={{ color: isSelected ? "var(--accent-color)" : "var(--text-muted)" }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {root.title}
                        </span>
                      </button>

                      {/* Nested Children Pages */}
                      {children.length > 0 && (
                        <div style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px" }}>
                          {children.map((child) => {
                            const isChildSelected = activePageId === child.id && !isEditing;
                            return (
                              <button
                                key={child.id}
                                onClick={() => {
                                  setActivePageId(child.id);
                                  setIsEditing(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  width: "100%",
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: isChildSelected ? "var(--accent-light)" : "transparent",
                                  color: isChildSelected ? "var(--accent-color)" : "var(--text-secondary)",
                                  fontWeight: isChildSelected ? 600 : 400,
                                  fontSize: "0.85rem",
                                  textAlign: "left",
                                  cursor: "pointer",
                                }}
                              >
                                <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {child.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Pane: Editor vs Viewer */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {isEditing ? (
              /* Editor Mode */
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", flex: 1, gap: "16px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {editingPageId ? "Edit Wiki Page" : "Create Wiki Page"}
                </h2>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. System Architecture Overview"
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
                    Parent Page (Hierarchy)
                  </label>
                  <select
                    value={parentIdInput}
                    onChange={(e) => setParentIdInput(e.target.value)}
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
                  >
                    <option value="">None (Top-Level Page)</option>
                    {wikiPages
                      .filter((w) => w.id !== editingPageId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                    Content (Markdown / Text)
                  </label>
                  <textarea
                    required
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    placeholder="Write documentation, requirements, architecture notes..."
                    rows={14}
                    style={{
                      width: "100%",
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.9rem",
                      fontFamily: "monospace",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
                    Save Page
                  </button>
                </div>
              </form>
            ) : activePage ? (
              /* Viewer Mode */
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Page Title & Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{activePage.title}</h1>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "var(--accent-light)",
                          color: "var(--accent-color)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontWeight: 600,
                        }}
                      >
                        v{activePage.version}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User size={12} />
                        {activePage.authorName}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        Last updated {new Date(activePage.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => startEdit(activePage)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(activePage.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "1px solid #fca5a5",
                        backgroundColor: "#fee2e2",
                        color: "var(--priority-high)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.85rem",
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

                {/* Page Content Display */}
                <div
                  style={{
                    flex: 1,
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    backgroundColor: "var(--bg-primary)",
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {activePage.content}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Wiki Page Selected"
                description="Select a page from the sidebar or click New Page to create documentation."
                actionText="Create Page"
                onAction={startCreate}
                icon={BookOpen}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
