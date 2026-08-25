import { LocalStorageUserRepository } from "./local/LocalStorageUserRepository";
import { LocalStorageProjectRepository } from "./local/LocalStorageProjectRepository";
import { LocalStorageIssueRepository } from "./local/LocalStorageIssueRepository";
import { LocalStorageWikiRepository } from "./local/LocalStorageWikiRepository";
import { LocalStorageFileRepository } from "./local/LocalStorageFileRepository";
import { LocalStorageRepositoryRepository } from "./local/LocalStorageRepositoryRepository";

export const userRepository = new LocalStorageUserRepository();
export const projectRepository = new LocalStorageProjectRepository();
export const issueRepository = new LocalStorageIssueRepository();
export const wikiRepository = new LocalStorageWikiRepository();
export const fileRepository = new LocalStorageFileRepository();
export const repositoryRepository = new LocalStorageRepositoryRepository();

export function resetLocalStorageData() {
  if (typeof window === "undefined") return;
  
  // Clear all backlog clone keys
  const keys = [
    "bl_user",
    "bl_users",
    "bl_projects",
    "bl_issues",
    "bl_comments",
    "bl_wiki",
    "bl_files",
    "bl_git_repos",
    "bl_activity",
    "bl_active_project_key"
  ];
  
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Export repository types
export * from "./types";
