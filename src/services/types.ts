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
  name: string;
  path: string;        // Local folder path mockup
  size: number;        // Bytes
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  issueId?: string;    // Attached to issue
}

export interface GitRepo {
  id: string;
  projectId: string;
  name: string;
  localPath: string;
  isConnected: boolean;
  createdAt: string;
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
  deleteComment(commentId: string): Promise<void>;

  // Activity Log
  getActivity(projectId: string): Promise<ActivityLog[]>;
  addActivity(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog>;
}

export interface IWikiRepository {
  getByProject(projectId: string): Promise<WikiPage[]>;
  getByTitle(projectId: string, title: string): Promise<WikiPage | null>;
  create(page: Omit<WikiPage, "id" | "createdAt" | "updatedAt" | "version">): Promise<WikiPage>;
  update(page: WikiPage): Promise<WikiPage>;
  delete(id: string): Promise<void>;
}

export interface IFileRepository {
  getByProject(projectId: string): Promise<FileMetadata[]>;
  upload(file: Omit<FileMetadata, "id" | "createdAt">): Promise<FileMetadata>;
  delete(id: string): Promise<void>;
}

export interface IRepositoryRepository {
  getByProject(projectId: string): Promise<GitRepo | null>;
  connect(repo: Omit<GitRepo, "id" | "createdAt" | "isConnected">): Promise<GitRepo>;
  disconnect(projectId: string): Promise<void>;
}
