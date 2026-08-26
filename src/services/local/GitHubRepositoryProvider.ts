import {
  GitRepo,
  GitCommit,
  GitBranch,
  GitPullRequest,
  IRepositoryProvider,
} from "../types";

export class GitHubRepositoryProvider implements IRepositoryProvider {
  private repoKey = "bl_git_repos";

  private getStoredRepos(): GitRepo[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.repoKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveRepos(list: GitRepo[]) {
    localStorage.setItem(this.repoKey, JSON.stringify(list));
  }

  async connect(
    projectId: string,
    name: string,
    localPath: string,
    providerType: "local" | "github" = "github",
    githubOwner: string = "gakhd625"
  ): Promise<GitRepo> {
    const list = this.getStoredRepos();
    const existingIdx = list.findIndex((r) => r.projectId === projectId);

    const repo: GitRepo = {
      id: `repo-gh-${Date.now()}`,
      projectId,
      name,
      localPath,
      isConnected: true,
      providerType: "github",
      githubOwner,
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
    if (!repo || repo.providerType !== "github") return null;

    const branches = await this.getBranches(projectId);
    const latestCommits = await this.getCommits(projectId);

    return { repo, branches, latestCommits };
  }

  async getBranches(projectId: string): Promise<GitBranch[]> {
    const repo = this.getStoredRepos().find((r) => r.projectId === projectId);
    if (!repo || !repo.githubOwner || !repo.name) {
      return [{ name: "main", isCurrent: true }];
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${repo.githubOwner}/${repo.name}/branches`);
      if (!res.ok) throw new Error("Failed to fetch GitHub branches");
      const data = await res.json();
      const currentBranch = repo.activeBranch || repo.defaultBranch || "main";

      return data.map((b: any) => ({
        name: b.name,
        isCurrent: b.name === currentBranch,
      }));
    } catch (err) {
      console.warn("GitHub API rate limit or offline mode, returning default branch", err);
      return [{ name: repo.activeBranch || "main", isCurrent: true }];
    }
  }

  async createBranch(projectId: string, branchName: string): Promise<GitBranch> {
    // Simulated branch creation for GitHub API without auth token write permission
    return { name: branchName, isCurrent: true };
  }

  async switchBranch(projectId: string, branchName: string): Promise<void> {
    const list = this.getStoredRepos();
    const rIdx = list.findIndex((r) => r.projectId === projectId);
    if (rIdx !== -1) {
      list[rIdx].activeBranch = branchName;
      this.saveRepos(list);
    }
  }

  async getCommits(projectId: string, branchName?: string): Promise<GitCommit[]> {
    const repo = this.getStoredRepos().find((r) => r.projectId === projectId);
    if (!repo || !repo.githubOwner || !repo.name) return [];

    const branch = branchName || repo.activeBranch || repo.defaultBranch || "main";

    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo.githubOwner}/${repo.name}/commits?sha=${branch}&per_page=15`
      );
      if (!res.ok) throw new Error("Failed to fetch GitHub commits");
      const data = await res.json();

      return data.map((c: any) => ({
        hash: c.sha.substring(0, 7),
        author: c.commit.author?.name || c.author?.login || "Contributor",
        email: c.commit.author?.email || "",
        date: c.commit.author?.date || new Date().toISOString(),
        message: c.commit.message,
        changedFiles: [],
      }));
    } catch (err) {
      console.warn("GitHub API error, returning empty commits", err);
      return [];
    }
  }

  async getPullRequests(projectId: string): Promise<GitPullRequest[]> {
    const repo = this.getStoredRepos().find((r) => r.projectId === projectId);
    if (!repo || !repo.githubOwner || !repo.name) return [];

    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo.githubOwner}/${repo.name}/pulls?state=all&per_page=10`
      );
      if (!res.ok) throw new Error("Failed to fetch GitHub pull requests");
      const data = await res.json();

      return data.map((pr: any) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state === "open" ? "open" : "closed",
        author: pr.user?.login || "Developer",
        authorAvatar: pr.user?.avatar_url,
        createdAt: pr.created_at,
        url: pr.html_url,
        headBranch: pr.head?.ref || "feature",
        baseBranch: pr.base?.ref || "main",
      }));
    } catch (err) {
      console.warn("GitHub API PR fetch error", err);
      return [];
    }
  }

  async getFileTree(projectId: string): Promise<string[]> {
    return [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/components/TopNavigation.tsx",
      "src/services/types.ts",
      "src/services/local/GitHubRepositoryProvider.ts",
      "README.md",
      "package.json",
    ];
  }

  async disconnect(projectId: string): Promise<void> {
    const list = this.getStoredRepos();
    const filtered = list.filter((r) => r.projectId !== projectId);
    this.saveRepos(filtered);
  }
}
