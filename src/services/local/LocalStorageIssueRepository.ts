import { Issue, Comment, ActivityLog, IIssueRepository } from "../types";

export class LocalStorageIssueRepository implements IIssueRepository {
  private issuesKey = "bl_issues";
  private commentsKey = "bl_comments";
  private activityKey = "bl_activity";
  private notificationsKey = "bl_notifications";

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

  private notifyUser(userId: string, title: string, message: string, link?: string) {
    if (typeof window === "undefined" || !userId) return;
    const stored = localStorage.getItem(this.notificationsKey);
    const list = stored ? JSON.parse(stored) : [];
    list.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.notificationsKey, JSON.stringify(list));
  }

  // Issues implementation
  async getByProject(projectId: string): Promise<Issue[]> {
    const list = this.getStoredIssues();
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
      userName: "Reporter",
      action: "created",
      details: `Created issue ${newIssue.key}`,
    });

    // Notify assignee if specified
    if (newIssue.assigneeId && newIssue.assigneeId !== newIssue.reporterId) {
      this.notifyUser(
        newIssue.assigneeId,
        "Issue Assigned to You",
        `You have been assigned to ${newIssue.key}: ${newIssue.title}`,
        `/projects/${newIssue.projectKey}/issues/${newIssue.key}`
      );
    }

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
      // Notify assigned user & reporter of status change
      const targetUsers = new Set<string>();
      if (issue.assigneeId && issue.assigneeId !== userId) targetUsers.add(issue.assigneeId);
      if (issue.reporterId && issue.reporterId !== userId) targetUsers.add(issue.reporterId);
      
      targetUsers.forEach((targetId) => {
        this.notifyUser(
          targetId,
          "Issue Status Changed",
          `${userName} changed status of ${issue.key} to ${issue.status}`,
          `/projects/${issue.projectKey}/issues/${issue.key}`
        );
      });
    }

    if (oldIssue.assigneeId !== issue.assigneeId) {
      changes.push("assignee");
      if (issue.assigneeId && issue.assigneeId !== userId) {
        this.notifyUser(
          issue.assigneeId,
          "Issue Assigned to You",
          `${userName} assigned you to ${issue.key}: ${issue.title}`,
          `/projects/${issue.projectKey}/issues/${issue.key}`
        );
      }
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
        details: `Updated ${changes.join(", ")} of issue ${issue.key}`,
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

    // Find issue details to notify
    const issues = this.getStoredIssues();
    const issue = issues.find((i) => i.id === comment.issueId);

    // Log activity
    await this.addActivity({
      projectId: issue ? issue.projectKey : comment.issueId,
      issueId: comment.issueId,
      userId: comment.userId,
      userName: comment.userName,
      action: "commented",
      details: `Added a comment on issue ${issue ? issue.key : ""}`,
    });

    if (issue) {
      const notifyUsers = new Set<string>();
      if (issue.assigneeId && issue.assigneeId !== comment.userId) notifyUsers.add(issue.assigneeId);
      if (issue.reporterId && issue.reporterId !== comment.userId) notifyUsers.add(issue.reporterId);

      notifyUsers.forEach((targetId) => {
        this.notifyUser(
          targetId,
          "New Comment on Issue",
          `${comment.userName} commented on ${issue.key}`,
          `/projects/${issue.projectKey}/issues/${issue.key}`
        );
      });
    }

    return newComment;
  }

  async updateComment(comment: Comment): Promise<Comment> {
    const comments = this.getStoredComments();
    const idx = comments.findIndex((c) => c.id === comment.id);
    if (idx === -1) throw new Error("Comment not found.");

    comments[idx] = {
      ...comment,
      content: comment.content,
    };
    this.saveComments(comments);
    return comments[idx];
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
