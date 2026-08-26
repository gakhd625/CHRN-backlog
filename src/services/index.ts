import { LocalStorageUserRepository } from "./local/LocalStorageUserRepository";
import { LocalStorageProjectRepository } from "./local/LocalStorageProjectRepository";
import { LocalStorageIssueRepository } from "./local/LocalStorageIssueRepository";
import { LocalStorageWikiRepository } from "./local/LocalStorageWikiRepository";
import { LocalStorageFileRepository } from "./local/LocalStorageFileRepository";
import { LocalStorageRepositoryRepository } from "./local/LocalStorageRepositoryRepository";
import { LocalStorageWorkflowRepository } from "./local/LocalStorageWorkflowRepository";
import { LocalStorageNotificationRepository } from "./local/LocalStorageNotificationRepository";
import { LocalGitRepositoryProvider } from "./local/LocalGitRepositoryProvider";
import { LocalStorageSearchService } from "./local/LocalStorageSearchService";
import { authorizationService, AuthorizationService } from "./AuthorizationService";

export const userRepository = new LocalStorageUserRepository();
export const projectRepository = new LocalStorageProjectRepository();
export const issueRepository = new LocalStorageIssueRepository();
export const wikiRepository = new LocalStorageWikiRepository();
export const fileRepository = new LocalStorageFileRepository();
export const repositoryRepository = new LocalStorageRepositoryRepository();
export const workflowRepository = new LocalStorageWorkflowRepository();
export const notificationRepository = new LocalStorageNotificationRepository();
export const repositoryProvider = new LocalGitRepositoryProvider();
export const searchService = new LocalStorageSearchService();
export { authorizationService, AuthorizationService };

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
    "bl_active_project_key",
    "bl_workflows",
    "bl_saved_filters",
    "bl_project_members",
    "bl_notifications",
  ];
  
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Export repository types
export * from "./types";
