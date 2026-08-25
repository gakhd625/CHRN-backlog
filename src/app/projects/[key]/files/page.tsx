"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Folder,
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Move,
  ChevronRight,
  FolderPlus,
  File,
  Image,
  Code,
  Archive,
  X,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import { fileRepository, FileMetadata } from "@/services";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function FilesPage() {
  const params = useParams();
  const { activeProject, setActiveProjectKey, currentUser } = useApp();
  const key = params?.key as string;

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [allProjectFolders, setAllProjectFolders] = useState<FileMetadata[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Root" },
  ]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState("");

  const [renameTarget, setRenameTarget] = useState<FileMetadata | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const [moveTarget, setMoveTarget] = useState<FileMetadata | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const loadDirectory = async () => {
    if (!key) return;
    try {
      const currentList = await fileRepository.getByProject(key, currentFolderId);
      setFiles(currentList);

      const allItems = await fileRepository.getAllByProject(key);
      const folders = allItems.filter((i) => i.isFolder);
      setAllProjectFolders(folders);
    } catch (err) {
      console.error("Failed to load directory items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadDirectory();
    }
  }, [key, currentFolderId, activeProject]);

  const navigateToFolder = (folder: FileMetadata) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim() || !key) return;
    try {
      await fileRepository.createFolder(
        key,
        folderNameInput.trim(),
        currentFolderId,
        currentUser?.id,
        currentUser?.name
      );
      setFolderNameInput("");
      setShowFolderModal(false);
      await loadDirectory();
    } catch (err: any) {
      alert(err.message || "Failed to create folder.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !key) return;

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        await fileRepository.uploadFile(
          key,
          f,
          currentFolderId,
          currentUser?.id,
          currentUser?.name
        );
      }
      await loadDirectory();
    } catch (err: any) {
      alert(err.message || "Failed to upload file.");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameInput.trim()) return;
    try {
      await fileRepository.rename(renameTarget.id, renameInput.trim());
      setRenameTarget(null);
      await loadDirectory();
    } catch (err: any) {
      alert(err.message || "Failed to rename.");
    }
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTarget) return;
    try {
      const targetId = moveFolderId === "root" ? null : moveFolderId;
      await fileRepository.move(moveTarget.id, targetId);
      setMoveTarget(null);
      await loadDirectory();
    } catch (err: any) {
      alert(err.message || "Failed to move.");
    }
  };

  const handleDelete = async (item: FileMetadata) => {
    const typeLabel = item.isFolder ? "folder and all its contents" : "file";
    if (confirm(`Are you sure you want to delete ${typeLabel} "${item.name}"?`)) {
      try {
        await fileRepository.delete(item.id);
        await loadDirectory();
      } catch (err: any) {
        alert(err.message || "Failed to delete.");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "--";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (item: FileMetadata) => {
    if (item.isFolder) return <Folder style={{ color: "#f59e0b" }} size={20} />;
    if (item.mimeType?.startsWith("image/")) return <Image style={{ color: "#3b82f6" }} size={20} />;
    if (item.mimeType?.includes("json") || item.mimeType?.includes("javascript"))
      return <Code style={{ color: "#10b981" }} size={20} />;
    if (item.mimeType?.includes("zip") || item.mimeType?.includes("tar"))
      return <Archive style={{ color: "#8b5cf6" }} size={20} />;
    return <FileText style={{ color: "var(--accent-color)" }} size={20} />;
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

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
        {/* Header & Main Actions */}
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
              <Folder style={{ color: "var(--accent-color)" }} />
              <span>Files & Storage</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Store, organize, and attach project assets and documents.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowFolderModal(true)}
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
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
              <FolderPlus size={16} />
              <span>New Folder</span>
            </button>

            <label
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
              <Upload size={16} />
              <span>Upload File</span>
              <input type="file" multiple onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {/* Breadcrumb Path */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "20px",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || "root"}>
              {idx > 0 && <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
              <span
                onClick={() => navigateToBreadcrumb(idx)}
                style={{
                  cursor: idx === breadcrumbs.length - 1 ? "default" : "pointer",
                  color: idx === breadcrumbs.length - 1 ? "var(--text-primary)" : "var(--accent-color)",
                  fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                }}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Files Directory Table */}
        {loading ? (
          <LoadingState message="Loading directory contents..." />
        ) : files.length === 0 ? (
          <EmptyState
            title="Folder is empty"
            description="Upload documents or create subfolders to keep your assets organized."
            icon={Folder}
          />
        ) : (
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
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)" }}>Name</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)", width: "120px" }}>Size</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)", width: "160px" }}>Uploaded By</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)", width: "140px" }}>Date</th>
                  <th style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-secondary)", width: "120px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        onClick={() => item.isFolder && navigateToFolder(item)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: item.isFolder ? "pointer" : "default",
                          fontWeight: item.isFolder ? 600 : 400,
                          color: item.isFolder ? "var(--text-primary)" : "var(--text-primary)",
                        }}
                      >
                        {getFileIcon(item)}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      {formatFileSize(item.sizeBytes)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "var(--accent-color)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.uploadedByName.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{item.uploadedByName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        {!item.isFolder && item.dataUrl && (
                          <a
                            href={item.dataUrl}
                            download={item.name}
                            title="Download file"
                            style={{
                              color: "var(--text-muted)",
                              padding: "4px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Download size={15} />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setRenameTarget(item);
                            setRenameInput(item.name);
                          }}
                          title="Rename"
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setMoveTarget(item);
                            setMoveFolderId(item.folderId || "root");
                          }}
                          title="Move"
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                        >
                          <Move size={15} />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          title="Delete"
                          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showFolderModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateFolder} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Create New Folder</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Folder Name *</label>
              <input type="text" required value={folderNameInput} onChange={(e) => setFolderNameInput(e.target.value)} placeholder="e.g. Specifications" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setShowFolderModal(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleRename} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Rename Item</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Name *</label>
              <input type="text" required value={renameInput} onChange={(e) => setRenameInput(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setRenameTarget(null)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Rename</button>
            </div>
          </form>
        </div>
      )}

      {/* Move Modal */}
      {moveTarget && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleMove} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Move "{moveTarget.name}"</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Target Folder *</label>
              <select value={moveFolderId} onChange={(e) => setMoveFolderId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", outline: "none" }}>
                <option value="root">Root Directory</option>
                {allProjectFolders
                  .filter((f) => f.id !== moveTarget.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setMoveTarget(null)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Move</button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
}
