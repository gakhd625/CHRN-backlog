export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  passwordHash?: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  issueId?: string;
  userId: string;
  userName: string;
  action: string;      // "created", "updated", "commented", "deleted", etc.
  details: string;     // e.g. "Changed status to In Progress"
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string;         // e.g., PROJECT-1
  projectId: string;
  projectKey: string;
  title: string;
  description: string;
  assigneeId?: string;
  reporterId: string;
  status: "open" | "progress" | "resolved" | "closed";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  startDate?: string;
  category?: string;
  labels: string[];
  milestone?: string;
  attachments: string[]; // FileMetadata IDs
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  content: string;
  parentId?: string;   // Page hierarchy support
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface FileMetadata {
  id: string;
  projectId: string;
  folderId?: string | null;
  name: string;
  isFolder: boolean;
  sizeBytes: number;
  mimeType?: string;
  dataUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  issueId?: string;
}

export interface GitRepo {
  id: string;
  projectId: string;
  name: string;
  localPath: string;
  isConnected: boolean;
  providerType?: "local" | "github";
  githubOwner?: string;
  defaultBranch?: string;
  activeBranch?: string;
  createdAt: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  changedFiles: string[];
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
}

export interface GitPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  authorAvatar?: string;
  createdAt: string;
  url: string;
  headBranch: string;
  baseBranch: string;
}

export interface IRepositoryProvider {
  connect(projectId: string, name: string, localPath: string, providerType?: "local" | "github", githubOwner?: string): Promise<GitRepo>;
  getOverview(projectId: string): Promise<{ repo: GitRepo; branches: GitBranch[]; latestCommits: GitCommit[] } | null>;
  getBranches(projectId: string): Promise<GitBranch[]>;
  createBranch(projectId: string, branchName: string): Promise<GitBranch>;
  switchBranch(projectId: string, branchName: string): Promise<void>;
  getCommits(projectId: string, branchName?: string): Promise<GitCommit[]>;
  getFileTree(projectId: string): Promise<string[]>;
  getPullRequests?(projectId: string): Promise<GitPullRequest[]>;
  disconnect(projectId: string): Promise<void>;
}

export interface IRepositoryRepository {
  getByProject(projectId: string): Promise<GitRepo | null>;
  connect(repo: Omit<GitRepo, "id" | "createdAt" | "isConnected">): Promise<GitRepo>;
  disconnect(projectId: string): Promise<void>;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: string;
  joinedAt: string;
}

// Repository Interfaces
export interface IUserRepository {
  getCurrentUser(): Promise<User | null>;
  setCurrentUser(user: User | null): Promise<void>;
  getAll(): Promise<User[]>;
  create(user: Omit<User, "id">): Promise<User>;
  update(user: User): Promise<User>;
  register(user: Omit<User, "id" | "passwordHash">, passwordPlain: string): Promise<User>;
  validateCredentials(email: string, passwordPlain: string): Promise<User | null>;
}

export interface IProjectRepository {
  getAll(): Promise<Project[]>;
  getByKey(key: string): Promise<Project | null>;
  create(project: Omit<Project, "id" | "createdAt">): Promise<Project>;
  update(project: Project): Promise<Project>;
  delete(key: string): Promise<void>;
  
  getMembers(projectId: string): Promise<ProjectMember[]>;
  addMember(projectId: string, userId: string, role: string): Promise<ProjectMember>;
  removeMember(projectId: string, memberId: string): Promise<void>;
  updateMemberRole(memberId: string, role: string): Promise<ProjectMember>;
  
  getActivity(projectId: string): Promise<ActivityLog[]>;
  addActivity(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog>;
}

export interface IIssueRepository {
  getByProject(projectId: string): Promise<Issue[]>;
  getByKey(projectKey: string, issueKey: string): Promise<Issue | null>;
  create(issue: Omit<Issue, "id" | "key" | "createdAt" | "updatedAt">): Promise<Issue>;
  update(issue: Issue, userId: string, userName: string): Promise<Issue>;
  delete(id: string): Promise<void>;
  
  // Comments
  getComments(issueId: string): Promise<Comment[]>;
  addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
  updateComment(comment: Comment): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;

  // Activity Log
  getActivity(projectId: string): Promise<ActivityLog[]>;
  addActivity(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog>;
}

export interface IWikiRepository {
  getByProject(projectId: string): Promise<WikiPage[]>;
  getById(id: string): Promise<WikiPage | null>;
  getByTitle(projectId: string, title: string): Promise<WikiPage | null>;
  create(page: Omit<WikiPage, "id" | "createdAt" | "updatedAt" | "version">): Promise<WikiPage>;
  update(page: WikiPage): Promise<WikiPage>;
  delete(id: string): Promise<void>;
}

export interface IFileStorageProvider {
  saveFile(file: File): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
}

export interface IFileRepository {
  getByProject(projectId: string, folderId?: string | null): Promise<FileMetadata[]>;
  getAllByProject(projectId: string): Promise<FileMetadata[]>;
  createFolder(projectId: string, name: string, parentFolderId?: string | null, userId?: string, userName?: string): Promise<FileMetadata>;
  uploadFile(projectId: string, file: File, folderId?: string | null, userId?: string, userName?: string): Promise<FileMetadata>;
  rename(id: string, newName: string): Promise<FileMetadata>;
  move(id: string, targetFolderId?: string | null): Promise<FileMetadata>;
  delete(id: string): Promise<void>;
}

export interface IRepositoryRepository {
  getByProject(projectId: string): Promise<GitRepo | null>;
  connect(repo: Omit<GitRepo, "id" | "createdAt" | "isConnected">): Promise<GitRepo>;
  disconnect(projectId: string): Promise<void>;
}

// Workflow & Status Configuration
export interface StatusConfig {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
}

export interface SavedFilter {
  id: string;
  projectId: string;
  name: string;
  filters: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    label?: string;
    category?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  };
  createdAt: string;
}

export interface IWorkflowRepository {
  getStatuses(projectId: string): Promise<StatusConfig[]>;
  addStatus(status: Omit<StatusConfig, "id">): Promise<StatusConfig>;
  updateStatus(status: StatusConfig): Promise<StatusConfig>;
  removeStatus(projectId: string, statusId: string): Promise<void>;
  reorderStatuses(projectId: string, statusIds: string[]): Promise<StatusConfig[]>;

  getSavedFilters(projectId: string): Promise<SavedFilter[]>;
  saveFilter(filter: Omit<SavedFilter, "id" | "createdAt">): Promise<SavedFilter>;
  deleteFilter(filterId: string): Promise<void>;
}

// Notifications Interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationRepository {
  getByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  addNotification(notification: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<Notification>;
  clearAll(userId: string): Promise<void>;
}
