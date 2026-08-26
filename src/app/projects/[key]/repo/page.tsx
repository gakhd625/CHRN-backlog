"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitPullRequest as GitPullRequestIcon,
  FileCode,
  Plus,
  Terminal,
  Unplug,
  CheckCircle,
  GitFork as GithubIcon,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";
import {
  repositoryProvider,
  GitRepo,
  GitCommit,
  GitBranch,
  GitPullRequest,
} from "@/services";
import { GitHubRepositoryProvider } from "@/services/local/GitHubRepositoryProvider";
import { LocalGitRepositoryProvider } from "@/services/local/LocalGitRepositoryProvider";

export default function RepoPage() {
  const params = useParams();
  const { activeProject, setActiveProjectKey } = useApp();
  const key = params?.key as string;

  const [repo, setRepo] = useState<GitRepo | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "commits" | "branches" | "pulls" | "files">("overview");

  // Connection Setup Form State
  const [providerType, setProviderType] = useState<"local" | "github">("github");
  const [githubOwnerInput, setGithubOwnerInput] = useState("gakhd625");
  const [repoNameInput, setRepoNameInput] = useState("CHRN-backlog");
  const [localPathInput, setLocalPathInput] = useState("c:/Users/gerly/Desktop/Chrono/Projects/backlog-clone");

  // Create Branch State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState("");

  useEffect(() => {
    if (key) {
      setActiveProjectKey(key);
    }
  }, [key, setActiveProjectKey]);

  const getProvider = (type?: string): any => {
    if (type === "github") {
      return new GitHubRepositoryProvider();
    }
    return repositoryProvider;
  };

  const loadRepoData = async () => {
    if (!key) return;
    try {
      // Check stored repo to determine provider
      const stored = localStorage.getItem("bl_git_repos");
      const list: GitRepo[] = stored ? JSON.parse(stored) : [];
      const found = list.find((r) => r.projectId === key && r.isConnected);

      if (found) {
        const provider = getProvider(found.providerType);
        const overview = await provider.getOverview(key);
        if (overview) {
          setRepo(overview.repo);
          setBranches(overview.branches);
          setCommits(overview.latestCommits);

          if (provider.getPullRequests) {
            const prs = await provider.getPullRequests(key);
            setPullRequests(prs);
          }

          const tree = await provider.getFileTree(key);
          setFiles(tree);
        } else {
          setRepo(null);
        }
      } else {
        setRepo(null);
      }
    } catch (err) {
      console.error("Failed to load repo data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadRepoData();
    }
  }, [key, activeProject]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoNameInput.trim() || !key) return;

    try {
      const provider = getProvider(providerType);
      await provider.connect(
        key,
        repoNameInput.trim(),
        localPathInput.trim(),
        providerType,
        githubOwnerInput.trim()
      );
      alert(`Repository connected successfully via ${providerType === "github" ? "GitHub REST API" : "Local Provider"}!`);
      await loadRepoData();
    } catch (err: any) {
      alert(err.message || "Failed to connect repository.");
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure you want to disconnect this Git repository?")) {
      try {
        const provider = getProvider(repo?.providerType);
        await provider.disconnect(key);
        setRepo(null);
        alert("Repository disconnected.");
      } catch (err: any) {
        alert(err.message || "Failed to disconnect repository.");
      }
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchInput.trim() || !key) return;

    try {
      const provider = getProvider(repo?.providerType);
      await provider.createBranch(key, newBranchInput.trim());
      setNewBranchInput("");
      setShowBranchModal(false);
      await loadRepoData();
      alert("Branch created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create branch.");
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    try {
      const provider = getProvider(repo?.providerType);
      await provider.switchBranch(key, branchName);
      await loadRepoData();
    } catch (err: any) {
      alert(err.message || "Failed to switch branch.");
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

  if (loading) {
    return (
      <MainLayout>
        <LoadingState message="Loading Git repository metadata..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="animate-fade-in">
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
              <GitBranchIcon style={{ color: "var(--accent-color)" }} />
              <span>Repository & Git</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              Connect local repositories or sync with public GitHub repositories via API.
            </p>
          </div>

          {repo && (
            <button
              onClick={handleDisconnect}
              style={{
                backgroundColor: "#fee2e2",
                color: "var(--priority-high)",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Unplug size={14} />
              <span>Disconnect Repo</span>
            </button>
          )}
        </div>

        {!repo ? (
          /* Connection Setup Screen */
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "560px",
              margin: "30px auto 0 auto",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "16px",
                  borderRadius: "16px",
                  backgroundColor: "var(--accent-light)",
                  color: "var(--accent-color)",
                  marginBottom: "12px",
                }}
              >
                {providerType === "github" ? <GithubIcon size={32} /> : <Terminal size={32} />}
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Connect Git Repository</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                Choose between connecting a GitHub repository or a Local Git folder.
              </p>
            </div>

            {/* Provider Type Toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setProviderType("github")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: providerType === "github" ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                  backgroundColor: providerType === "github" ? "var(--accent-light)" : "var(--bg-primary)",
                  color: providerType === "github" ? "var(--accent-color)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <GithubIcon size={18} />
                <span>GitHub API</span>
              </button>
              <button
                type="button"
                onClick={() => setProviderType("local")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: providerType === "local" ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                  backgroundColor: providerType === "local" ? "var(--accent-light)" : "var(--bg-primary)",
                  color: providerType === "local" ? "var(--accent-color)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Terminal size={18} />
                <span>Local Git</span>
              </button>
            </div>

            <form onSubmit={handleConnect} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {providerType === "github" ? (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                      GitHub Owner / Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={githubOwnerInput}
                      onChange={(e) => setGithubOwnerInput(e.target.value)}
                      placeholder="e.g. gakhd625"
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
                      GitHub Repository Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={repoNameInput}
                      onChange={(e) => setRepoNameInput(e.target.value)}
                      placeholder="e.g. CHRN-backlog"
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
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={repoNameInput}
                      onChange={(e) => setRepoNameInput(e.target.value)}
                      placeholder={`e.g. ${key.toLowerCase()}-repo`}
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
                      Local Folder Path *
                    </label>
                    <input
                      type="text"
                      required
                      value={localPathInput}
                      onChange={(e) => setLocalPathInput(e.target.value)}
                      placeholder="e.g. c:/Users/gerly/Desktop/Chrono/Projects/backlog-clone"
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
                </>
              )}

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "var(--accent-color)",
                  color: "var(--text-on-accent)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                Connect {providerType === "github" ? "GitHub" : "Local"} Repository
              </button>
            </form>
          </div>
        ) : (
          /* Connected Repository Main Interface */
          <div>
            {/* Repo Info Banner */}
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  {repo.providerType === "github" ? (
                    <GithubIcon size={22} style={{ color: "var(--text-primary)" }} />
                  ) : (
                    <Terminal size={22} style={{ color: "var(--accent-color)" }} />
                  )}
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {repo.providerType === "github" ? `${repo.githubOwner}/${repo.name}` : repo.name}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: "#d1fae5",
                      color: "var(--status-resolved)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle size={12} />
                    Connected ({repo.providerType === "github" ? "GitHub API" : "Local"})
                  </span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {repo.localPath || `https://github.com/${repo.githubOwner}/${repo.name}`}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Active Branch:
                </span>
                <select
                  value={repo.activeBranch || "main"}
                  onChange={(e) => handleSwitchBranch(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--accent-color)",
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} {b.isCurrent ? "(current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border-color)",
                marginBottom: "24px",
              }}
            >
              {[
                { id: "overview", label: "Overview" },
                { id: "commits", label: `Commits (${commits.length})` },
                { id: "branches", label: `Branches (${branches.length})` },
                { id: "pulls", label: `Pull Requests (${pullRequests.length})` },
                { id: "files", label: "Code Files" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "2px solid var(--accent-color)" : "2px solid transparent",
                    backgroundColor: "transparent",
                    color: activeTab === tab.id ? "var(--accent-color)" : "var(--text-secondary)",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Recent Commits</h3>
                  {commits.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No commits loaded yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {commits.slice(0, 3).map((c) => (
                        <div
                          key={c.hash}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "12px",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <GitCommitIcon size={18} style={{ color: "var(--accent-color)", marginTop: "2px" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.message}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {c.author} committed on {new Date(c.date).toLocaleString()} • Hash: <code>{c.hash}</code>
                            </div>
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
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Repository Details</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>Provider</span>
                      <strong style={{ color: "var(--text-primary)", textTransform: "capitalize" }}>
                        {repo.providerType || "local"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>Default Branch</span>
                      <strong style={{ color: "var(--text-primary)" }}>{repo.defaultBranch || "main"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>Total Commits</span>
                      <strong style={{ color: "var(--text-primary)" }}>{commits.length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Commits */}
            {activeTab === "commits" && (
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {commits.map((c) => (
                    <div
                      key={c.hash}
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{c.message}</h4>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            backgroundColor: "var(--bg-tertiary)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            color: "var(--accent-color)",
                          }}
                        >
                          {c.hash}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <User size={12} />
                          {c.author}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} />
                          {new Date(c.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Branches */}
            {activeTab === "branches" && (
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Branches Overview</h3>
                  <button
                    onClick={() => setShowBranchModal(true)}
                    style={{
                      backgroundColor: "var(--accent-color)",
                      color: "var(--text-on-accent)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={14} />
                    <span>Create Branch</span>
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {branches.map((b) => (
                    <div
                      key={b.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <GitBranchIcon size={16} style={{ color: b.isCurrent ? "var(--accent-color)" : "var(--text-muted)" }} />
                        <span style={{ fontWeight: b.isCurrent ? 700 : 500, fontSize: "0.9rem" }}>{b.name}</span>
                        {b.isCurrent && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              backgroundColor: "var(--accent-light)",
                              color: "var(--accent-color)",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            current
                          </span>
                        )}
                      </div>

                      {!b.isCurrent && (
                        <button
                          onClick={() => handleSwitchBranch(b.name)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "transparent",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Pull Requests */}
            {activeTab === "pulls" && (
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <GitPullRequestIcon size={18} style={{ color: "var(--accent-color)" }} />
                  <span>Pull Requests</span>
                </h3>

                {pullRequests.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No open or merged pull requests found for this repository.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {pullRequests.map((pr) => (
                      <div
                        key={pr.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px",
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "10px",
                                color: "#ffffff",
                                backgroundColor: pr.state === "open" ? "#10b981" : "#8b5cf6",
                                textTransform: "uppercase",
                              }}
                            >
                              {pr.state} #{pr.number}
                            </span>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{pr.title}</h4>
                          </div>

                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            By <strong>{pr.author}</strong> • {pr.headBranch} → {pr.baseBranch} • {new Date(pr.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "var(--accent-color)",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          <span>View on GitHub</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Code Files */}
            {activeTab === "files" && (
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Repository File Tree</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {files.map((file) => (
                    <div
                      key={file}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                      }}
                    >
                      <FileCode size={16} style={{ color: "var(--accent-color)" }} />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      {showBranchModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateBranch} style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Create Branch</h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>Branch Name *</label>
              <input type="text" required value={newBranchInput} onChange={(e) => setNewBranchInput(e.target.value)} placeholder="e.g. feature/github-api" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setShowBranchModal(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
              <button type="submit" style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--accent-color)", color: "var(--text-on-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Create</button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  );
}
