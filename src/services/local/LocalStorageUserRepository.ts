import { User, IUserRepository } from "../types";

export class LocalStorageUserRepository implements IUserRepository {
  private userKey = "bl_user";
  private usersKey = "bl_users";

  // Pre-hashed 'password123' using SHA-256
  private defaultUser: User = {
    id: "user-1",
    name: "Gerly",
    email: "gerly@example.com",
    role: "Administrator",
    avatar: "",
    passwordHash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
  };

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    let hashBuffer: ArrayBuffer;
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    } else {
      // Node.js fallback or standard global crypto fallback
      const crypto = require("crypto");
      return crypto.createHash("sha256").update(password).digest("hex");
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

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
      return null; // Return null to force login flow in Phase 3
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
    
    // Also update current active session if it is the same user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(this.userKey);
      if (stored) {
        const curr = JSON.parse(stored) as User;
        if (curr.id === user.id) {
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }
      }
    }
    
    return user;
  }

  async register(user: Omit<User, "id" | "passwordHash">, passwordPlain: string): Promise<User> {
    const list = this.getStoredUsers();
    
    // Check if email already exists
    const exists = list.some((u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim());
    if (exists) {
      throw new Error(`Email address "${user.email}" is already registered.`);
    }

    const passwordHash = await this.hashPassword(passwordPlain);
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      passwordHash,
    };

    list.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(list));
    return newUser;
  }

  async validateCredentials(email: string, passwordPlain: string): Promise<User | null> {
    const list = this.getStoredUsers();
    const user = list.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!user || !user.passwordHash) return null;

    const hash = await this.hashPassword(passwordPlain);
    if (user.passwordHash === hash) {
      // Strip passwordHash before returning to prevent leaking in session state
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }

    return null;
  }
}
