import { GitRepo, IRepositoryRepository } from "../types";

export class LocalStorageRepositoryRepository implements IRepositoryRepository {
  private key = "bl_git_repos";

  private getStored(): GitRepo[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  }

  private save(list: GitRepo[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getByProject(projectId: string): Promise<GitRepo | null> {
    const list = this.getStored();
    return list.find((r) => r.projectId === projectId) || null;
  }

  async connect(repo: Omit<GitRepo, "id" | "createdAt" | "isConnected">): Promise<GitRepo> {
    const list = this.getStored();
    
    // Check if repo already connected for this project
    const idx = list.findIndex((r) => r.projectId === repo.projectId);
    
    const newRepo: GitRepo = {
      ...repo,
      id: `repo-${Date.now()}`,
      isConnected: true,
      createdAt: new Date().toISOString(),
    };

    if (idx !== -1) {
      list[idx] = newRepo;
    } else {
      list.push(newRepo);
    }
    
    this.save(list);
    return newRepo;
  }

  async disconnect(projectId: string): Promise<void> {
    const list = this.getStored();
    const filtered = list.filter((r) => r.projectId !== projectId);
    this.save(filtered);
  }
}
