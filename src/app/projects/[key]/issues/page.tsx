"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ListTodo, Plus, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Trash2, Filter, Save, BookmarkCheck, X, CheckSquare, Square,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import {
  issueRepository, projectRepository, workflowRepository,
  Issue, ProjectMember, StatusConfig, SavedFilter,
} from "@/services";

type SortField = "key" | "title" | "priority" | "status" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newStatus, setNewStatus] = useState("open");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newStartDate, setNewStartDate] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newMilestone, setNewMilestone] = useState("");
  const [newLabelsInput, setNewLabelsInput] = useState("");

  useEffect(() => {
    if (key) setActiveProjectKey(key);
  }, [key, setActiveProjectKey]);

  const loadData = async () => {
    if (!key) return;
    try {
      const [issueList, membersList, statusList, filterList] = await Promise.all([
        issueRepository.getByProject(key),
        projectRepository.getMembers(key),
        workflowRepository.getStatuses(key),
        workflowRepository.getSavedFilters(key),
      ]);
      setIssues(issueList);
      setMembers(membersList);
      setStatuses(statusList);
      setSavedFilters(filterList);
    } catch (err) {
      console.error("Failed to load issues", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) loadData();
  }, [key, activeProject]);

  // Show bulk bar when selections exist
  useEffect(() => {
    setShowBulkBar(selectedIds.size > 0);
  }, [selectedIds]);

  // Compute unique labels and categories for filter dropdowns
  const allLabels = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => i.labels.forEach((l) => set.add(l)));
    return Array.from(set).sort();
  }, [issues]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => { if (i.category) set.add(i.category); });
    return Array.from(set).sort();
  }, [issues]);

  // Filtered & Sorted list
  const processed = useMemo(() => {
    let list = [...issues];

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.key.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    // Dropdown filters
    if (filterStatus) list = list.filter((i) => i.status === filterStatus);
    if (filterPriority) list = list.filter((i) => i.priority === filterPriority);
    if (filterAssignee) list = list.filter((i) => i.assigneeId === filterAssignee);
    if (filterLabel) list = list.filter((i) => i.labels.includes(filterLabel));
    if (filterCategory) list = list.filter((i) => i.category === filterCategory);
    if (filterDueDateFrom) list = list.filter((i) => i.dueDate && i.dueDate >= filterDueDateFrom);
    if (filterDueDateTo) list = list.filter((i) => i.dueDate && i.dueDate <= filterDueDateTo);

    // Sorting
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "key": {
          const aNum = parseInt(a.key.split("-").pop() || "0", 10);
          const bNum = parseInt(b.key.split("-").pop() || "0", 10);
          cmp = aNum - bNum;
          break;
        }
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "dueDate":
          cmp = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [issues, searchQuery, filterStatus, filterPriority, filterAssignee, filterLabel, filterCategory, filterDueDateFrom, filterDueDateTo, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginatedIssues = processed.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, filterStatus, filterPriority, filterAssignee, filterLabel, filterCategory, filterDueDateFrom, filterDueDateTo, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedIssues.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedIssues.map((i) => i.id)));
    }
  };

  // Bulk Actions
  const handleBulkAction = async () => {
    if (!currentUser) return;
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        const issue = issues.find((i) => i.id === id);
        if (!issue) continue;
        const updated = { ...issue };
        if (bulkStatus) updated.status = bulkStatus as any;
        if (bulkPriority) updated.priority = bulkPriority as any;
        if (bulkAssignee) updated.assigneeId = bulkAssignee === "__unassign__" ? undefined : bulkAssignee;
        await issueRepository.update(updated, currentUser.id, currentUser.name);
      }
      alert(`Updated ${ids.length} issue(s).`);
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkPriority("");
      setBulkAssignee("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Bulk action failed.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to delete ${ids.length} issue(s)?`)) return;
    try {
      for (const id of ids) {
        await issueRepository.delete(id);
      }
      alert(`Deleted ${ids.length} issue(s).`);
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      alert(err.message || "Bulk delete failed.");
    }
  };

  // Saved filters
  const handleSaveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim() || !key) return;
    try {
      await workflowRepository.saveFilter({
        projectId: key,
        name: filterName.trim(),
        filters: {
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
          assigneeId: filterAssignee || undefined,
          label: filterLabel || undefined,
          category: filterCategory || undefined,
          dueDateFrom: filterDueDateFrom || undefined,
          dueDateTo: filterDueDateTo || undefined,
        },
      });
      setFilterName("");
      setShowSaveFilterModal(false);
      await loadData();
      alert("Filter saved!");
    } catch (err: any) {
      alert(err.message || "Failed to save filter.");
    }
  };

  const applyFilter = (f: SavedFilter) => {
    setFilterStatus(f.filters.status || "");
    setFilterPriority(f.filters.priority || "");
    setFilterAssignee(f.filters.assigneeId || "");
    setFilterLabel(f.filters.label || "");
    setFilterCategory(f.filters.category || "");
    setFilterDueDateFrom(f.filters.dueDateFrom || "");
    setFilterDueDateTo(f.filters.dueDateTo || "");
    setShowFilters(true);
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterPriority("");
    setFilterAssignee("");
    setFilterLabel("");
    setFilterCategory("");
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
    setSearchQuery("");
  };

  const handleDeleteFilter = async (id: string) => {
    await workflowRepository.deleteFilter(id);
    await loadData();
  };

  // Create Issue
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser || !key) return;
    try {
      const labels = newLabelsInput.split(",").map((l) => l.trim()).filter((l) => l.length > 0);
      await issueRepository.create({
        projectId: activeProject?.id || `proj-${key}`,
        projectKey: key,
        title: newTitle.trim(),
        description: newDescription.trim(),
        assigneeId: newAssigneeId || undefined,
        reporterId: currentUser.id,
        status: newStatus as any,
        priority: newPriority,
        startDate: newStartDate || undefined,
        dueDate: newDueDate || undefined,
        category: newCategory.trim() || undefined,
        milestone: newMilestone.trim() || undefined,
        labels,
        attachments: [],
      });
      setNewTitle(""); setNewDescription(""); setNewAssigneeId(""); setNewStatus("open");
      setNewPriority("medium"); setNewStartDate(""); setNewDueDate(""); setNewCategory("");
      setNewMilestone(""); setNewLabelsInput("");
      setShowCreateModal(false);
      alert("Issue created successfully!");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create issue.");
    }
  };

  const getStatusColor = (s: string) => {
    const found = statuses.find((st) => st.name.toLowerCase().replace(/\s+/g, "") === s || st.name.toLowerCase() === s);
    if (found) return found.color;
    switch (s) {
      case "open": return "#3b82f6";
      case "progress": return "#f59e0b";
      case "resolved": return "#10b981";
      case "closed": return "#6b7280";
      default: return "#6b7280";
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // Shared input style
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "0.85rem",
  };

  if (!activeProject) {
    return <MainLayout><div style={{ textAlign: "center", padding: "48px" }}><h2>Project not found</h2></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <ListTodo style={{ color: "var(--accent-color)" }} />
              <span>Issues</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>({processed.length})</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Track tasks, bugs, and improvements for this project.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={16} /><span>Add Issue</span>
          </button>
        </div>

        {/* Search + Filter Toggle + Saved Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input type="text" placeholder="Search issues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, paddingLeft: "38px" }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: showFilters ? "var(--accent-light)" : "var(--bg-secondary)", color: showFilters ? "var(--accent-color)" : "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            <Filter size={14} /><span>Filters</span>
          </button>
          {savedFilters.length > 0 && savedFilters.map((sf) => (
            <div key={sf.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button onClick={() => applyFilter(sf)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <BookmarkCheck size={12} />{sf.name}
              </button>
              <button onClick={() => handleDeleteFilter(sf.id)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}><X size={12} /></button>
            </div>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", marginBottom: "16px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
                  <option value="">All</option>
                  <option value="open">Open</option>
                  <option value="progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Priority</label>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={inputStyle}>
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Assignee</label>
                <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={inputStyle}>
                  <option value="">All</option>
                  {members.map((m) => <option key={m.id} value={m.userId}>{m.userName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Label</label>
                <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)} style={inputStyle}>
                  <option value="">All</option>
                  {allLabels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={inputStyle}>
                  <option value="">All</option>
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Due Date From</label>
                <input type="date" value={filterDueDateFrom} onChange={(e) => setFilterDueDateFrom(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px", color: "var(--text-muted)" }}>Due Date To</label>
                <input type="date" value={filterDueDateTo} onChange={(e) => setFilterDueDateTo(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button onClick={clearFilters} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Clear All</button>
              <button onClick={() => setShowSaveFilterModal(true)} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}><Save size={12} />Save Filter</button>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkBar && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "var(--accent-light)", border: "1px solid var(--accent-color)", borderRadius: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--accent-color)" }}>{selectedIds.size} selected</span>
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "120px" }}>
              <option value="">Set Status...</option>
              <option value="open">Open</option>
              <option value="progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select value={bulkPriority} onChange={(e) => setBulkPriority(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "120px" }}>
              <option value="">Set Priority...</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: "130px" }}>
              <option value="">Set Assignee...</option>
              <option value="__unassign__">Unassign</option>
              {members.map((m) => <option key={m.id} value={m.userId}>{m.userName}</option>)}
            </select>
            <button onClick={handleBulkAction} disabled={!bulkStatus && !bulkPriority && !bulkAssignee} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, opacity: (!bulkStatus && !bulkPriority && !bulkAssignee) ? 0.5 : 1 }}>Apply</button>
            <button onClick={handleBulkDelete} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #fca5a5", backgroundColor: "#fee2e2", color: "var(--priority-high)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Trash2 size={12} />Delete</button>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <LoadingState message="Loading issues..." />
        ) : processed.length === 0 ? (
          <EmptyState
            title={searchQuery || filterStatus || filterPriority ? "No matching issues" : "No issues found"}
            description={searchQuery || filterStatus || filterPriority ? "Try adjusting your filters." : "Create your first issue to plan tasks."}
            actionText={!(searchQuery || filterStatus || filterPriority) ? "Create Issue" : undefined}
            onAction={!(searchQuery || filterStatus || filterPriority) ? () => setShowCreateModal(true) : undefined}
            icon={ListTodo}
          />
        ) : (
          <>
            <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
                    <th style={{ padding: "14px 16px", width: "40px" }}>
                      <button onClick={toggleSelectAll} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                        {selectedIds.size === paginatedIssues.length && paginatedIssues.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    {([["key", "Key", "100px"], ["title", "Title", undefined], ["status", "Status", "120px"], ["priority", "Priority", "100px"], ["assignee", "Assignee", "150px"], ["dueDate", "Due Date", "120px"]] as [SortField | "assignee", string, string | undefined][]).map(([field, label, width]) => (
                      <th
                        key={field}
                        style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)", cursor: field !== "assignee" ? "pointer" : "default", width: width, userSelect: "none" }}
                        onClick={() => field !== "assignee" && toggleSort(field as SortField)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {label}
                          {field !== "assignee" && <SortIcon field={field as SortField} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedIssues.map((issue) => {
                    const assignee = members.find((m) => m.userId === issue.assigneeId);
                    return (
                      <tr
                        key={issue.id}
                        style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.15s ease", backgroundColor: selectedIds.has(issue.id) ? "var(--accent-light)" : "transparent" }}
                        onMouseEnter={(e) => { if (!selectedIds.has(issue.id)) e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"; }}
                        onMouseLeave={(e) => { if (!selectedIds.has(issue.id)) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <button onClick={() => toggleSelect(issue.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                            {selectedIds.has(issue.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--accent-color)", cursor: "pointer" }} onClick={() => router.push(`/projects/${key}/issues/${issue.key}`)}>
                          {issue.key}
                        </td>
                        <td style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => router.push(`/projects/${key}/issues/${issue.key}`)}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontWeight: 500 }}>{issue.title}</span>
                            {issue.labels.length > 0 && (
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {issue.labels.map((l, i) => (
                                  <span key={i} style={{ fontSize: "0.7rem", backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--border-color)" }}>{l}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "12px", color: "#fff", backgroundColor: getStatusColor(issue.status), textTransform: "uppercase" }}>
                            {issue.status === "progress" ? "In Progress" : issue.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 600, color: getPriorityColor(issue.priority), textTransform: "capitalize" }}>{issue.priority}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                          {assignee ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600 }}>
                                {assignee.userName.substring(0, 2).toUpperCase()}
                              </div>
                              <span>{assignee.userName}</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                          {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Rows per page:</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ ...inputStyle, width: "auto", padding: "4px 8px" }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processed.length)} of {processed.length}</span>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 8px", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, color: "var(--text-secondary)" }}><ChevronLeft size={16} /></button>
                <span>Page {page}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "4px 8px", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, color: "var(--text-secondary)" }}><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <form onSubmit={handleCreateIssue} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Create New Issue</h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Issue Title *</label>
              <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Brief summary" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Detailed explanation..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Assignee</label>
                <select value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.userId}>{m.userName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as any)} style={inputStyle}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={inputStyle}>
                  <option value="open">Open</option><option value="progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Labels (comma-separated)</label>
                <input type="text" value={newLabelsInput} onChange={(e) => setNewLabelsInput(e.target.value)} placeholder="bug, UI" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Start Date</label>
                <input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Due Date</label>
                <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Category</label>
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Documentation" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Milestone</label>
                <input type="text" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="v1.0-beta" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleSaveFilter} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Save Current Filter</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Filter Name *</label>
              <input type="text" required value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="e.g. My Open Issues" style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setShowSaveFilterModal(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Save</button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
}
