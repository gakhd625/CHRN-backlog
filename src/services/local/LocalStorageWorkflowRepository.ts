import { StatusConfig, SavedFilter, IWorkflowRepository } from "../types";

const DEFAULT_STATUSES: Omit<StatusConfig, "id" | "projectId">[] = [
  { name: "Open", color: "#3b82f6", order: 0 },
  { name: "In Progress", color: "#f59e0b", order: 1 },
  { name: "Resolved", color: "#10b981", order: 2 },
  { name: "Closed", color: "#6b7280", order: 3 },
];

export class LocalStorageWorkflowRepository implements IWorkflowRepository {
  private statusKey = "bl_workflows";
  private filterKey = "bl_saved_filters";

  private getStoredStatuses(): StatusConfig[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.statusKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveStatuses(list: StatusConfig[]) {
    localStorage.setItem(this.statusKey, JSON.stringify(list));
  }

  private getStoredFilters(): SavedFilter[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.filterKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveFilters(list: SavedFilter[]) {
    localStorage.setItem(this.filterKey, JSON.stringify(list));
  }

  // Statuses
  async getStatuses(projectId: string): Promise<StatusConfig[]> {
    let all = this.getStoredStatuses();
    const projectStatuses = all.filter((s) => s.projectId === projectId);

    // Seed defaults if none exist
    if (projectStatuses.length === 0) {
      const defaults: StatusConfig[] = DEFAULT_STATUSES.map((d, i) => ({
        ...d,
        id: `status-${projectId}-${i}`,
        projectId,
      }));
      all = [...all, ...defaults];
      this.saveStatuses(all);
      return defaults;
    }

    return projectStatuses.sort((a, b) => a.order - b.order);
  }

  async addStatus(status: Omit<StatusConfig, "id">): Promise<StatusConfig> {
    const all = this.getStoredStatuses();

    // Check duplicate name in project
    const dup = all.find(
      (s) => s.projectId === status.projectId && s.name.toLowerCase() === status.name.toLowerCase()
    );
    if (dup) throw new Error(`Status "${status.name}" already exists in this project.`);

    const newStatus: StatusConfig = {
      ...status,
      id: `status-${Date.now()}`,
    };
    all.push(newStatus);
    this.saveStatuses(all);
    return newStatus;
  }

  async updateStatus(status: StatusConfig): Promise<StatusConfig> {
    const all = this.getStoredStatuses();
    const idx = all.findIndex((s) => s.id === status.id);
    if (idx === -1) throw new Error("Status not found.");
    all[idx] = status;
    this.saveStatuses(all);
    return status;
  }

  async removeStatus(projectId: string, statusId: string): Promise<void> {
    const all = this.getStoredStatuses();
    const filtered = all.filter((s) => !(s.id === statusId && s.projectId === projectId));
    this.saveStatuses(filtered);
  }

  async reorderStatuses(projectId: string, statusIds: string[]): Promise<StatusConfig[]> {
    const all = this.getStoredStatuses();
    const projectStatuses = all.filter((s) => s.projectId === projectId);
    const others = all.filter((s) => s.projectId !== projectId);

    const reordered = statusIds
      .map((id, order) => {
        const found = projectStatuses.find((s) => s.id === id);
        return found ? { ...found, order } : null;
      })
      .filter(Boolean) as StatusConfig[];

    this.saveStatuses([...others, ...reordered]);
    return reordered;
  }

  // Saved Filters
  async getSavedFilters(projectId: string): Promise<SavedFilter[]> {
    const all = this.getStoredFilters();
    return all.filter((f) => f.projectId === projectId);
  }

  async saveFilter(filter: Omit<SavedFilter, "id" | "createdAt">): Promise<SavedFilter> {
    const all = this.getStoredFilters();
    const newFilter: SavedFilter = {
      ...filter,
      id: `filter-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    all.push(newFilter);
    this.saveFilters(all);
    return newFilter;
  }

  async deleteFilter(filterId: string): Promise<void> {
    const all = this.getStoredFilters();
    const filtered = all.filter((f) => f.id !== filterId);
    this.saveFilters(filtered);
  }
}
