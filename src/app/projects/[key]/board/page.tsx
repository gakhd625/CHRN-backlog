"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { Kanban, Plus, Settings } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";

export default function KanbanBoardPage() {
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

  // Initial column definitions for preview
  const columns = [
    { id: "open", name: "Open", count: 0, color: "var(--status-open)" },
    { id: "progress", name: "In Progress", count: 0, color: "var(--status-in-progress)" },
    { id: "resolved", name: "Resolved", count: 0, color: "var(--status-resolved)" },
    { id: "closed", name: "Closed", count: 0, color: "var(--status-closed)" },
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }} className="animate-fade-in">
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
              <Kanban style={{ color: "var(--accent-color)" }} />
              <span>Kanban Board</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Visualize project tasks and drag-and-drop to update statuses.
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
            <Plus size={16} />
            <span>Add Card</span>
          </button>
        </div>

        {/* Board View */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            flex: 1,
            overflowX: "auto",
            minHeight: "450px",
          }}
        >
          {columns.map((col) => (
            <div
              key={col.id}
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                padding: "16px",
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  borderBottom: `2px solid ${col.color}`,
                  paddingBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{col.name}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {col.count}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "8px",
                  padding: "20px",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No issues in {col.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
