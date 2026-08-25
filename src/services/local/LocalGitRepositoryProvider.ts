import {
  GitRepo,
  GitCommit,
  GitBranch,
  IRepositoryProvider,
} from "../types";

export class LocalGitRepositoryProvider implements IRepositoryProvider {
  private repoKey = "bl_git_repos";
  private branchKey = "bl_git_branches";
  private commitKey = "bl_git_commits";

  private getStoredRepos(): GitRepo[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.repoKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveRepos(list: GitRepo[]) {
    localStorage.setItem(this.repoKey, JSON.stringify(list));
  }

  private getStoredBranches(projectId: string): GitBranch[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`${this.branchKey}_${projectId}`);
    if (!stored) {
      const defaults: GitBranch[] = [
        { name: "main", isCurrent: true },
        { name: "develop", isCurrent: false },
      ];
      localStorage.setItem(`${this.branchKey}_${projectId}`, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(stored);
  }

  private saveBranches(projectId: string, list: GitBranch[]) {
    localStorage.setItem(`${this.branchKey}_${projectId}`, JSON.stringify(list));
  }

  private getStoredCommits(projectId: string): GitCommit[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(`${this.commitKey}_${projectId}`);
    if (!stored) {
      const defaultCommits: GitCommit[] = [
        {
          hash: "560eda7",
          author: "Gerly Ann",
          email: "gerly@example.com",
          date: new Date(Date.now() - 3600000 * 2).toISOString(),
          message: "Implement Phase 6: Advanced filtering, sorting, pagination, and saved filters",
          changedFiles: ["src/app/projects/[key]/issues/page.tsx", "src/services/types.ts"],
        },
        {
          hash: "b49e87a",
          author: "Gerly Ann",
          email: "gerly@example.com",
          date: new Date(Date.now() - 3600000 * 6).toISOString(),
          message: "Implement Phase 5: Core Issue tracking system, comments, detail page, and edit forms",
          changedFiles: ["src/app/projects/[key]/issues/[issueKey]/page.tsx"],
        },
        {
          hash: "b98f1f8",
          author: "Gerly Ann",
          email: "gerly@example.com",
          date: new Date(Date.now() - 3600000 * 12).toISOString(),
          message: "Implement Phase 4: Project Management, Project Members, and Activity Stream",
          changedFiles: ["src/services/local/LocalStorageProjectRepository.ts"],
        },
        {
          hash: "146517f",
          author: "Gerly Ann",
          email: "gerly@example.com",
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          message: "Implement Phase 3: local user authentication, SHA-256 passwords, register, and login",
          changedFiles: ["src/app/login/page.tsx", "src/components/AuthGuard.tsx"],
        },
      ];
      localStorage.setItem(`${this.commitKey}_${projectId}`, JSON.stringify(defaultCommits));
      return defaultCommits;
    }
    return JSON.parse(stored);
  }

  async connect(projectId: string, name: string, localPath: string): Promise<GitRepo> {
    const list = this.getStoredRepos();
    const existingIdx = list.findIndex((r) => r.projectId === projectId);

    const repo: GitRepo = {
      id: `repo-${Date.now()}`,
      projectId,
      name,
      localPath,
      isConnected: true,
      defaultBranch: "main",
      activeBranch: "main",
      createdAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      list[existingIdx] = repo;
    } else {
      list.push(repo);
    }

    this.saveRepos(list);
    return repo;
  }

  async getOverview(
    projectId: string
  ): Promise<{ repo: GitRepo; branches: GitBranch[]; latestCommits: GitCommit[] } | null> {
    const list = this.getStoredRepos();
    const repo = list.find((r) => r.projectId === projectId && r.isConnected);
    if (!repo) return null;

    const branches = this.getStoredBranches(projectId);
    const latestCommits = this.getStoredCommits(projectId);

    return { repo, branches, latestCommits };
  }

  async getBranches(projectId: string): Promise<GitBranch[]> {
    return this.getStoredBranches(projectId);
  }

  async createBranch(projectId: string, branchName: string): Promise<GitBranch> {
    const branches = this.getStoredBranches(projectId);
    const exists = branches.some((b) => b.name.toLowerCase() === branchName.toLowerCase());
    if (exists) {
      throw new Error(`Branch "${branchName}" already exists.`);
    }

    // Set new branch as active
    branches.forEach((b) => (b.isCurrent = false));
    const newBranch: GitBranch = { name: branchName, isCurrent: true };
    branches.push(newBranch);
    this.saveBranches(projectId, branches);

    // Update active branch on GitRepo
    const repos = this.getStoredRepos();
    const rIdx = repos.findIndex((r) => r.projectId === projectId);
    if (rIdx !== -1) {
      repos[rIdx].activeBranch = branchName;
      this.saveRepos(repos);
    }

    return newBranch;
  }

  async switchBranch(projectId: string, branchName: string): Promise<void> {
    const branches = this.getStoredBranches(projectId);
    const idx = branches.findIndex((b) => b.name === branchName);
    if (idx === -1) throw new Error("Branch not found.");

    branches.forEach((b) => (b.isCurrent = false));
    branches[idx].isCurrent = true;
    this.saveBranches(projectId, branches);

    const repos = this.getStoredRepos();
    const rIdx = repos.findIndex((r) => r.projectId === projectId);
    if (rIdx !== -1) {
      repos[rIdx].activeBranch = branchName;
      this.saveRepos(repos);
    }
  }

  async getCommits(projectId: string, branchName?: string): Promise<GitCommit[]> {
    return this.getStoredCommits(projectId);
  }

  async getFileTree(projectId: string): Promise<string[]> {
    return [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/globals.css",
      "src/components/MainLayout.tsx",
      "src/components/TopNavigation.tsx",
      "src/services/types.ts",
      "src/services/index.ts",
      "README.md",
      "package.json",
      "next.config.ts",
    ];
  }

  async disconnect(projectId: string): Promise<void> {
    const list = this.getStoredRepos();
    const filtered = list.filter((r) => r.projectId !== projectId);
    this.saveRepos(filtered);

    if (typeof window !== "undefined") {
      localStorage.removeItem(`${this.branchKey}_${projectId}`);
      localStorage.removeItem(`${this.commitKey}_${projectId}`);
    }
  }
}
