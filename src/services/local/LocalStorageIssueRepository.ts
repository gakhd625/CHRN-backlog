import { Issue, Comment, ActivityLog, IIssueRepository } from "../types";

export class LocalStorageIssueRepository implements IIssueRepository {
  private issuesKey = "bl_issues";
  private commentsKey = "bl_comments";
  private activityKey = "bl_activity";

  private getStoredIssues(): Issue[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.issuesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveIssues(list: Issue[]) {
    localStorage.setItem(this.issuesKey, JSON.stringify(list));
  }

  private getStoredComments(): Comment[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.commentsKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveComments(list: Comment[]) {
    localStorage.setItem(this.commentsKey, JSON.stringify(list));
  }

  private getStoredActivity(): ActivityLog[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.activityKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveActivity(list: ActivityLog[]) {
    localStorage.setItem(this.activityKey, JSON.stringify(list));
  }

  // Issues implementation
  async getByProject(projectId: string): Promise<Issue[]> {
    const list = this.getStoredIssues();
    // In our simplified model, projectId is the project Key or ID. Let's filter on both
    return list.filter((i) => i.projectId === projectId || i.projectKey === projectId);
  }

  async getByKey(projectKey: string, issueKey: string): Promise<Issue | null> {
    const list = this.getStoredIssues();
    return (
      list.find(
        (i) =>
          i.projectKey.toUpperCase() === projectKey.toUpperCase() &&
          i.key.toUpperCase() === issueKey.toUpperCase()
      ) || null
    );
  }

  async create(issue: Omit<Issue, "id" | "key" | "createdAt" | "updatedAt">): Promise<Issue> {
    const list = this.getStoredIssues();
    
    // Find next issue index number for this project key
    const projIssues = list.filter((i) => i.projectKey.toUpperCase() === issue.projectKey.toUpperCase());
    let nextNum = 1;
    if (projIssues.length > 0) {
      const nums = projIssues.map((i) => {
        const parts = i.key.split("-");
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }

    const newIssue: Issue = {
      ...issue,
      id: `issue-${Date.now()}`,
      key: `${issue.projectKey.toUpperCase()}-${nextNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newIssue);
    this.saveIssues(list);

    // Track creation activity
    await this.addActivity({
      projectId: issue.projectKey,
      issueId: newIssue.id,
      userId: issue.reporterId,
      userName: "Reporter", // Custom hook will override or load user names
      action: "created",
      details: `Created issue ${newIssue.key}`,
    });

    return newIssue;
  }

  async update(issue: Issue, userId: string, userName: string): Promise<Issue> {
    const list = this.getStoredIssues();
    const idx = list.findIndex((i) => i.id === issue.id);
    if (idx === -1) throw new Error("Issue not found");

    const oldIssue = list[idx];
    const changes: string[] = [];

    if (oldIssue.status !== issue.status) {
      changes.push(`status to ${issue.status}`);
    }
    if (oldIssue.assigneeId !== issue.assigneeId) {
      changes.push("assignee");
    }
    if (oldIssue.title !== issue.title) {
      changes.push("title");
    }

    const updatedIssue: Issue = {
      ...issue,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updatedIssue;
    this.saveIssues(list);

    // Log update activity if changes detected
    if (changes.length > 0) {
      await this.addActivity({
        projectId: issue.projectKey,
        issueId: issue.id,
        userId,
        userName,
        action: "updated",
        details: `Updated ${changes.join(", ")}`,
      });
    }

    return updatedIssue;
  }

  async delete(id: string): Promise<void> {
    const list = this.getStoredIssues();
    const filtered = list.filter((i) => i.id !== id);
    this.saveIssues(filtered);

    // Delete comments associated with this issue
    const comments = this.getStoredComments();
    const filteredComments = comments.filter((c) => c.issueId !== id);
    this.saveComments(filteredComments);
  }

  // Comments implementation
  async getComments(issueId: string): Promise<Comment[]> {
    const comments = this.getStoredComments();
    return comments.filter((c) => c.issueId === issueId);
  }

  async addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    const comments = this.getStoredComments();
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    this.saveComments(comments);

    // Log activity
    await this.addActivity({
      projectId: comment.issueId, // Using issueId as context
      issueId: comment.issueId,
      userId: comment.userId,
      userName: comment.userName,
      action: "commented",
      details: "Added a comment",
    });

    return newComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const comments = this.getStoredComments();
    const filtered = comments.filter((c) => c.id !== commentId);
    this.saveComments(filtered);
  }

  // Activity log implementation
  async getActivity(projectId: string): Promise<ActivityLog[]> {
    const activity = this.getStoredActivity();
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
    this.saveActivity(activity);
    return newLog;
  }
}
