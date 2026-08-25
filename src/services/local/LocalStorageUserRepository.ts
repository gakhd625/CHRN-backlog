import { User, IUserRepository } from "../types";

export class LocalStorageUserRepository implements IUserRepository {
  private userKey = "bl_user";
  private usersKey = "bl_users";

  private defaultUser: User = {
    id: "user-1",
    name: "Gerly",
    email: "gerly@example.com",
    role: "Administrator",
    avatar: "",
  };

  private getStoredUsers(): User[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.usersKey);
    if (!stored) {
      const list = [this.defaultUser];
      localStorage.setItem(this.usersKey, JSON.stringify(list));
      return list;
    }
    return JSON.parse(stored);
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(this.userKey);
    if (!stored) {
      // Auto login default user if no active session
      localStorage.setItem(this.userKey, JSON.stringify(this.defaultUser));
      return this.defaultUser;
    }
    return JSON.parse(stored);
  }

  async setCurrentUser(user: User | null): Promise<void> {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      // Update in master list as well
      const list = this.getStoredUsers();
      const idx = list.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        list[idx] = user;
      } else {
        list.push(user);
      }
      localStorage.setItem(this.usersKey, JSON.stringify(list));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  async getAll(): Promise<User[]> {
    return this.getStoredUsers();
  }

  async create(user: Omit<User, "id">): Promise<User> {
    const list = this.getStoredUsers();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
    };
    list.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(list));
    return newUser;
  }

  async update(user: User): Promise<User> {
    const list = this.getStoredUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error("User not found");
    list[idx] = user;
    localStorage.setItem(this.usersKey, JSON.stringify(list));
    return user;
  }
}
