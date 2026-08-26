import { SearchResult, ISearchService, Issue, Comment, WikiPage, FileMetadata, Project, User } from "../types";

export class LocalStorageSearchService implements ISearchService {
  async search(query: string, filters?: { projectId?: string; type?: string }): Promise<SearchResult[]> {
    if (typeof window === "undefined" || !query || !query.trim()) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Search Issues
    if (!filters?.type || filters.type === "issue") {
      const storedIssues = localStorage.getItem("bl_issues");
      if (storedIssues) {
        const issues: Issue[] = JSON.parse(storedIssues);
        issues.forEach((i) => {
          if (filters?.projectId && i.projectKey !== filters.projectId && i.projectId !== filters.projectId) {
            return;
          }
          if (
            i.title.toLowerCase().includes(q) ||
            i.key.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q)
          ) {
            results.push({
              id: i.id,
              type: "issue",
              title: `${i.key}: ${i.title}`,
              snippet: i.description ? i.description.substring(0, 80) + "..." : "No description",
              link: `/projects/${i.projectKey}/issues/${i.key}`,
              projectKey: i.projectKey,
              updatedAt: i.updatedAt,
            });
          }
        });
      }
    }

    // 2. Search Comments
    if (!filters?.type || filters.type === "comment") {
      const storedComments = localStorage.getItem("bl_comments");
      if (storedComments) {
        const comments: Comment[] = JSON.parse(storedComments);
        comments.forEach((c) => {
          if (c.content.toLowerCase().includes(q)) {
            results.push({
              id: c.id,
              type: "comment",
              title: `Comment by ${c.userName}`,
              snippet: c.content.substring(0, 80) + "...",
              link: `/projects/${filters?.projectId || "DEMO"}/issues`,
              updatedAt: c.createdAt,
            });
          }
        });
      }
    }

    // 3. Search Wiki Pages
    if (!filters?.type || filters.type === "wiki") {
      const storedWiki = localStorage.getItem("bl_wiki");
      if (storedWiki) {
        const pages: WikiPage[] = JSON.parse(storedWiki);
        pages.forEach((w) => {
          if (filters?.projectId && w.projectId !== filters.projectId) return;
          if (w.title.toLowerCase().includes(q) || w.content.toLowerCase().includes(q)) {
            results.push({
              id: w.id,
              type: "wiki",
              title: `Wiki: ${w.title}`,
              snippet: w.content ? w.content.substring(0, 80) + "..." : "Empty page",
              link: `/projects/${w.projectId}/wiki`,
              projectKey: w.projectId,
              updatedAt: w.updatedAt,
            });
          }
        });
      }
    }

    // 4. Search Files
    if (!filters?.type || filters.type === "file") {
      const storedFiles = localStorage.getItem("bl_files");
      if (storedFiles) {
        const files: FileMetadata[] = JSON.parse(storedFiles);
        files.forEach((f) => {
          if (filters?.projectId && f.projectId !== filters.projectId) return;
          if (f.name.toLowerCase().includes(q)) {
            results.push({
              id: f.id,
              type: "file",
              title: `File: ${f.name}`,
              snippet: `Uploaded by ${f.uploadedByName}`,
              link: `/projects/${f.projectId}/files`,
              projectKey: f.projectId,
              updatedAt: f.createdAt,
            });
          }
        });
      }
    }

    // 5. Search Projects
    if (!filters?.type || filters.type === "project") {
      const storedProjects = localStorage.getItem("bl_projects");
      if (storedProjects) {
        const projects: Project[] = JSON.parse(storedProjects);
        projects.forEach((p) => {
          if (p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))) {
            results.push({
              id: p.id,
              type: "project",
              title: `Project: ${p.name} (${p.key})`,
              snippet: p.description || "Project dashboard",
              link: `/projects/${p.key}`,
              projectKey: p.key,
              updatedAt: p.createdAt,
            });
          }
        });
      }
    }

    return results;
  }
}
