import { Project, ProjectMember, ActivityLog, IProjectRepository, User } from "../types";

export class LocalStorageProjectRepository implements IProjectRepository {
  private key = "bl_projects";
  private membersKey = "bl_project_members";
  private activityKey = "bl_activity";
  private usersKey = "bl_users";

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

  private getStoredMembers(): ProjectMember[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.membersKey);
    return stored ? JSON.parse(stored) : [];
  }

  private getStoredActivity(): ActivityLog[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.activityKey);
    return stored ? JSON.parse(stored) : [];
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

    // Auto add current user as Administrator of the project
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("bl_user");
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        const members = this.getStoredMembers();
        const newMember: ProjectMember = {
          id: `pm-${Date.now()}`,
          projectId: newProject.key,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userAvatar: user.avatar,
          role: "Administrator",
          joinedAt: new Date().toISOString(),
        };
        members.push(newMember);
        localStorage.setItem(this.membersKey, JSON.stringify(members));

        // Log project created activity
        await this.addActivity({
          projectId: newProject.key,
          userId: user.id,
          userName: user.name,
          action: "created",
          details: `Created project "${newProject.name}"`,
        });
      }
    }

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

    // Log update activity
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("bl_user");
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        await this.addActivity({
          projectId: project.key,
          userId: user.id,
          userName: user.name,
          action: "updated",
          details: `Updated project settings for "${project.name}"`,
        });
      }
    }

    return list[idx];
  }

  async delete(projectKey: string): Promise<void> {
    const list = this.getStored();
    const filtered = list.filter((p) => p.key !== projectKey.toUpperCase());
    localStorage.setItem(this.key, JSON.stringify(filtered));

    // Clear dependent items (issues, wiki, etc.)
    const keysToFilter = [
      "bl_issues",
      "bl_wiki",
      "bl_files",
      "bl_git_repos",
      "bl_activity",
      "bl_project_members"
    ];
    keysToFilter.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as any[];
        const updated = parsed.filter(
          (item) => item.projectKey !== projectKey.toUpperCase() && item.projectId !== projectKey.toUpperCase()
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
    });
  }

  // Members Management
  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const members = this.getStoredMembers();
    // Default mock project membership if empty (e.g. for pre-seeded project)
    if (members.length === 0 && (projectId === "BACKLOG" || projectId === "MARKETING")) {
      const list = this.getStored();
      const proj = list.find(p => p.key === projectId);
      if (proj) {
        const userStored = localStorage.getItem("bl_user");
        const defaultUser = userStored
          ? (JSON.parse(userStored) as User)
          : { id: "user-1", name: "Gerly", email: "gerly@example.com", role: "Administrator" };

        const initialMember: ProjectMember = {
          id: `pm-${Date.now()}`,
          projectId,
          userId: defaultUser.id,
          userName: defaultUser.name,
          userEmail: defaultUser.email,
          role: "Administrator",
          joinedAt: proj.createdAt || new Date().toISOString(),
        };
        const updatedMembers = [initialMember];
        localStorage.setItem(this.membersKey, JSON.stringify(updatedMembers));
        return updatedMembers;
      }
    }
    return members.filter((m) => m.projectId === projectId);
  }

  async addMember(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    const members = this.getStoredMembers();
    
    // Check if user is already a member
    const exists = members.some((m) => m.projectId === projectId && m.userId === userId);
    if (exists) {
      throw new Error("User is already a member of this project.");
    }

    // Get user profiles from master list
    const storedUsers = localStorage.getItem(this.usersKey);
    const users = storedUsers ? (JSON.parse(storedUsers) as User[]) : [];
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("User profile not found.");
    }

    const newMember: ProjectMember = {
      id: `pm-${Date.now()}`,
      projectId,
      userId,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
      role,
      joinedAt: new Date().toISOString(),
    };

    members.push(newMember);
    localStorage.setItem(this.membersKey, JSON.stringify(members));

    // Log member added activity
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("bl_user");
      if (storedUser) {
        const activeUser = JSON.parse(storedUser) as User;
        await this.addActivity({
          projectId,
          userId: activeUser.id,
          userName: activeUser.name,
          action: "updated",
          details: `Added ${user.name} to the project as ${role}`,
        });
      }
    }

    return newMember;
  }

  async removeMember(projectId: string, memberId: string): Promise<void> {
    const members = this.getStoredMembers();
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error("Project member not found.");

    const filtered = members.filter((m) => m.id !== memberId);
    localStorage.setItem(this.membersKey, JSON.stringify(filtered));

    // Log member removed activity
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("bl_user");
      if (storedUser) {
        const activeUser = JSON.parse(storedUser) as User;
        await this.addActivity({
          projectId,
          userId: activeUser.id,
          userName: activeUser.name,
          action: "updated",
          details: `Removed ${member.userName} from the project`,
        });
      }
    }
  }

  async updateMemberRole(memberId: string, role: string): Promise<ProjectMember> {
    const members = this.getStoredMembers();
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx === -1) throw new Error("Project member not found.");

    const oldRole = members[idx].role;
    members[idx].role = role;
    localStorage.setItem(this.membersKey, JSON.stringify(members));

    // Log role change activity
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("bl_user");
      if (storedUser) {
        const activeUser = JSON.parse(storedUser) as User;
        await this.addActivity({
          projectId: members[idx].projectId,
          userId: activeUser.id,
          userName: activeUser.name,
          action: "updated",
          details: `Changed role of ${members[idx].userName} from ${oldRole} to ${role}`,
        });
      }
    }

    return members[idx];
  }

  // Activities Management
  async getActivity(projectId: string): Promise<ActivityLog[]> {
    const activity = this.getStoredActivity();
    // Filter on both projectId and projectKey just in case
    return activity.filter((a) => a.projectId === projectId).reverse(); // Latest first
  }

  async addActivity(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog> {
    const activity = this.getStoredActivity();
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    activity.push(newLog);
    localStorage.setItem(this.activityKey, JSON.stringify(activity));
    return newLog;
  }
}
