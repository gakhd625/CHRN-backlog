import { ProjectRole, Permission, ProjectMember } from "./types";

const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  "Project Administrator": [
    "manage_project",
    "create_issue",
    "edit_issue",
    "delete_issue",
    "manage_files",
    "manage_wiki",
    "manage_repo",
    "manage_members",
    "manage_settings",
  ],
  Manager: [
    "create_issue",
    "edit_issue",
    "delete_issue",
    "manage_files",
    "manage_wiki",
    "manage_repo",
    "manage_members",
  ],
  Developer: [
    "create_issue",
    "edit_issue",
    "manage_files",
    "manage_wiki",
  ],
  Reporter: [
    "create_issue",
  ],
  Viewer: [],
};

export class AuthorizationService {
  hasPermission(role: ProjectRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  async getUserRoleInProject(userId: string, projectId: string): Promise<ProjectRole> {
    if (typeof window === "undefined") return "Project Administrator";

    const stored = localStorage.getItem("bl_project_members");
    if (!stored) return "Project Administrator"; // Default fallback if no member mapping exists yet

    const members: ProjectMember[] = JSON.parse(stored);
    const member = members.find(
      (m) => m.projectId === projectId && m.userId === userId
    );

    return member ? member.role : "Project Administrator";
  }

  async checkPermission(userId: string, projectId: string, permission: Permission): Promise<void> {
    const role = await this.getUserRoleInProject(userId, projectId);
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Unauthorized: Your role "${role}" does not have permission to execute "${permission}".`);
    }
  }
}

export const authorizationService = new AuthorizationService();
