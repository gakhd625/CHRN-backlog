import { FileMetadata, IFileRepository, IFileStorageProvider } from "../types";
import { LocalFileStorageProvider } from "./LocalFileStorageProvider";

export class LocalStorageFileRepository implements IFileRepository {
  private key = "bl_files";
  private storageProvider: IFileStorageProvider;

  constructor(storageProvider?: IFileStorageProvider) {
    this.storageProvider = storageProvider || new LocalFileStorageProvider();
  }

  private getStored(): FileMetadata[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  }

  private save(list: FileMetadata[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getByProject(projectId: string, folderId?: string | null): Promise<FileMetadata[]> {
    const list = this.getStored();
    return list.filter((f) => {
      const matchProj = f.projectId === projectId;
      if (!folderId) {
        return matchProj && (!f.folderId || f.folderId === null);
      }
      return matchProj && f.folderId === folderId;
    });
  }

  async getAllByProject(projectId: string): Promise<FileMetadata[]> {
    const list = this.getStored();
    return list.filter((f) => f.projectId === projectId);
  }

  async createFolder(
    projectId: string,
    name: string,
    parentFolderId?: string | null,
    userId: string = "system",
    userName: string = "User"
  ): Promise<FileMetadata> {
    const list = this.getStored();
    
    // Check duplicate in same folder
    const exists = list.some(
      (f) =>
        f.projectId === projectId &&
        f.isFolder &&
        (f.folderId || null) === (parentFolderId || null) &&
        f.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      throw new Error(`Folder "${name}" already exists in this directory.`);
    }

    const newFolder: FileMetadata = {
      id: `folder-${Date.now()}`,
      projectId,
      folderId: parentFolderId || null,
      name,
      isFolder: true,
      sizeBytes: 0,
      uploadedBy: userId,
      uploadedByName: userName,
      createdAt: new Date().toISOString(),
    };

    list.push(newFolder);
    this.save(list);
    return newFolder;
  }

  async uploadFile(
    projectId: string,
    file: File,
    folderId?: string | null,
    userId: string = "system",
    userName: string = "User"
  ): Promise<FileMetadata> {
    const list = this.getStored();
    const dataUrl = await this.storageProvider.saveFile(file);

    const newFile: FileMetadata = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      projectId,
      folderId: folderId || null,
      name: file.name,
      isFolder: false,
      sizeBytes: file.size,
      mimeType: file.type,
      dataUrl,
      uploadedBy: userId,
      uploadedByName: userName,
      createdAt: new Date().toISOString(),
    };

    list.push(newFile);
    this.save(list);
    return newFile;
  }

  async rename(id: string, newName: string): Promise<FileMetadata> {
    const list = this.getStored();
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("File or folder not found.");

    list[idx].name = newName;
    this.save(list);
    return list[idx];
  }

  async move(id: string, targetFolderId?: string | null): Promise<FileMetadata> {
    const list = this.getStored();
    const idx = list.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("File or folder not found.");

    // Prevent moving folder into itself
    if (list[idx].isFolder && id === targetFolderId) {
      throw new Error("Cannot move a folder inside itself.");
    }

    list[idx].folderId = targetFolderId || null;
    this.save(list);
    return list[idx];
  }

  async delete(id: string): Promise<void> {
    let list = this.getStored();
    const item = list.find((f) => f.id === id);
    if (!item) return;

    if (item.isFolder) {
      // Find all nested items inside folder
      const idsToDelete = new Set<string>([id]);
      let changed = true;

      while (changed) {
        changed = false;
        list.forEach((f) => {
          if (f.folderId && idsToDelete.has(f.folderId) && !idsToDelete.has(f.id)) {
            idsToDelete.add(f.id);
            changed = true;
          }
        });
      }

      list = list.filter((f) => !idsToDelete.has(f.id));
    } else {
      list = list.filter((f) => f.id !== id);
    }

    this.save(list);
  }
}
