import { Notification, INotificationRepository } from "../types";

export class LocalStorageNotificationRepository implements INotificationRepository {
  private key = "bl_notifications";

  private getStored(): Notification[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  }

  private save(list: Notification[]) {
    localStorage.setItem(this.key, JSON.stringify(list));
  }

  async getByUser(userId: string): Promise<Notification[]> {
    const list = this.getStored();
    return list.filter((n) => n.userId === userId).reverse(); // latest first
  }

  async markAsRead(notificationId: string): Promise<void> {
    const list = this.getStored();
    const idx = list.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      list[idx].isRead = true;
      this.save(list);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const list = this.getStored();
    list.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.save(list);
  }

  async addNotification(
    notification: Omit<Notification, "id" | "isRead" | "createdAt">
  ): Promise<Notification> {
    const list = this.getStored();
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    list.push(newNotification);
    this.save(list);
    return newNotification;
  }

  async clearAll(userId: string): Promise<void> {
    const list = this.getStored();
    const filtered = list.filter((n) => n.userId !== userId);
    this.save(filtered);
  }
}
