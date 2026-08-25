import { FileMetadata, IFileRepository } from "../types";

export class LocalStorageFileRepository implements IFileRepository {
  private key = "bl_files";

  private getStored(): FileMetadata[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  }

  private save(list: FileMetadata[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getByProject(projectId: string): Promise<FileMetadata[]> {
    const list = this.getStored();
    return list.filter((f) => f.projectId === projectId);
  }

  async upload(file: Omit<FileMetadata, "id" | "createdAt">): Promise<FileMetadata> {
    const list = this.getStored();

    const newFile: FileMetadata = {
      ...file,
      id: `file-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    list.push(newFile);
    this.save(list);
    return newFile;
  }

  async delete(id: string): Promise<void> {
    const list = this.getStored();
    const filtered = list.filter((f) => f.id !== id);
    this.save(filtered);
  }
}
