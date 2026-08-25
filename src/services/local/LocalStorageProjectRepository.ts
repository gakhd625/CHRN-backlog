import { Project, IProjectRepository } from "../types";

export class LocalStorageProjectRepository implements IProjectRepository {
  private key = "bl_projects";

  private defaultProjects: Project[] = [
    {
      id: "proj-1",
      key: "BACKLOG",
      name: "Backlog Clone Development",
      description: "Rebuilding backlog project-management tool local-first",
      createdAt: new Date().toISOString(),
    },
    {
      id: "proj-2",
      key: "MARKETING",
      name: "Marketing Website Redesign",
      description: "Revamp landing pages and SEO marketing assets",
      createdAt: new Date().toISOString(),
    },
  ];

  private getStored(): Project[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    if (!stored) {
      localStorage.setItem(this.key, JSON.stringify(this.defaultProjects));
      return this.defaultProjects;
    }
    return JSON.parse(stored);
  }

  async getAll(): Promise<Project[]> {
    return this.getStored();
  }

  async getByKey(projectKey: string): Promise<Project | null> {
    const list = this.getStored();
    return list.find((p) => p.key === projectKey.toUpperCase()) || null;
  }

  async create(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
    const list = this.getStored();
    
    // Check if key already exists
    const exists = list.some((p) => p.key === project.key.toUpperCase());
    if (exists) {
      throw new Error(`Project key "${project.key}" is already in use.`);
    }

    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      key: project.key.toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    list.push(newProject);
    localStorage.setItem(this.key, JSON.stringify(list));
    return newProject;
  }

  async update(project: Project): Promise<Project> {
    const list = this.getStored();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx === -1) throw new Error("Project not found");
    
    list[idx] = {
      ...list[idx],
      name: project.name,
      description: project.description,
    };
    
    localStorage.setItem(this.key, JSON.stringify(list));
    return list[idx];
  }

  async delete(projectKey: string): Promise<void> {
    const list = this.getStored();
    const filtered = list.filter((p) => p.key !== projectKey.toUpperCase());
    localStorage.setItem(this.key, JSON.stringify(filtered));

    // Clear dependent items (issues, wiki, etc.)
    // In a real local storage database, this would be cascade delete.
    // Let's implement clearing of associated tables in the reset logic or right here.
    const keysToFilter = ["bl_issues", "bl_wiki", "bl_files", "bl_git_repos", "bl_activity"];
    keysToFilter.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as any[];
        // Filter out items matching this project key or id
        // We know project has key, issues have projectKey, others have projectId (let's check details)
        const updated = parsed.filter(
          (item) => item.projectKey !== projectKey.toUpperCase() && item.projectId !== projectKey.toUpperCase()
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
    });
  }
}
