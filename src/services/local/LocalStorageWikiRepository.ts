import { WikiPage, IWikiRepository } from "../types";

export class LocalStorageWikiRepository implements IWikiRepository {
  private key = "bl_wiki";

  private getStored(): WikiPage[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  }

  private save(list: WikiPage[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getByProject(projectId: string): Promise<WikiPage[]> {
    const list = this.getStored();
    return list.filter((w) => w.projectId === projectId);
  }

  async getById(id: string): Promise<WikiPage | null> {
    const list = this.getStored();
    return list.find((w) => w.id === id) || null;
  }

  async getByTitle(projectId: string, title: string): Promise<WikiPage | null> {
    const list = this.getStored();
    return (
      list.find(
        (w) =>
          w.projectId === projectId &&
          w.title.toLowerCase().trim() === title.toLowerCase().trim()
      ) || null
    );
  }

  async create(page: Omit<WikiPage, "id" | "createdAt" | "updatedAt" | "version">): Promise<WikiPage> {
    const list = this.getStored();

    // Prevent duplicate titles in same project
    const exists = list.some(
      (w) =>
        w.projectId === page.projectId &&
        w.title.toLowerCase().trim() === page.title.toLowerCase().trim()
    );
    if (exists) {
      throw new Error(`A Wiki page with title "${page.title}" already exists.`);
    }

    const newPage: WikiPage = {
      ...page,
      id: `wiki-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newPage);
    this.save(list);
    return newPage;
  }

  async update(page: WikiPage): Promise<WikiPage> {
    const list = this.getStored();
    const idx = list.findIndex((w) => w.id === page.id);
    if (idx === -1) throw new Error("Wiki page not found");

    const updatedPage: WikiPage = {
      ...page,
      version: (list[idx].version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updatedPage;
    this.save(list);
    return updatedPage;
  }

  async delete(id: string): Promise<void> {
    let list = this.getStored();
    
    // Clear parentId for any child pages referencing this page
    list = list.map((w) => {
      if (w.parentId === id) {
        return { ...w, parentId: undefined };
      }
      return w;
    });

    const filtered = list.filter((w) => w.id !== id);
    this.save(filtered);
  }
}
