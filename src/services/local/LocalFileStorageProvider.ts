import { IFileStorageProvider } from "../types";

export class LocalFileStorageProvider implements IFileStorageProvider {
  async saveFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file for local storage."));
      };
      reader.readAsDataURL(file);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    // In local DataURL storage, dataURL is embedded in metadata object, so clearing metadata clears storage.
    return Promise.resolve();
  }
}
