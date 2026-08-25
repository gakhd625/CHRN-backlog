"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Project, userRepository, projectRepository } from "@/services";
export type { User, Project };

interface AppContextType {
  currentUser: User | null;
  projects: Project[];
  activeProject: Project | null;
  setActiveProjectKey: (key: string | null) => void;
  setCurrentUser: (user: User | null) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<Project>;
  refreshProjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectKey, setActiveProjectKeyInternal] = useState<string | null>(null);

  const refreshProjects = async () => {
    try {
      const list = await projectRepository.getAll();
      setProjects(list);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  // Load initial data from repositories
  useEffect(() => {
    async function loadData() {
      try {
        const user = await userRepository.getCurrentUser();
        setCurrentUserState(user);

        const list = await projectRepository.getAll();
        setProjects(list);

        const storedActiveProject = localStorage.getItem("bl_active_project_key");
        if (storedActiveProject) {
          setActiveProjectKeyInternal(storedActiveProject);
        }
      } catch (err) {
        console.error("Failed to initialize app state", err);
      }
    }
    loadData();
  }, []);

  const setCurrentUser = async (user: User | null) => {
    try {
      await userRepository.setCurrentUser(user);
      setCurrentUserState(user);
    } catch (err) {
      console.error("Failed to set current user", err);
    }
  };

  const addProject = async (project: Omit<Project, "id" | "createdAt">) => {
    try {
      const newProj = await projectRepository.create(project);
      await refreshProjects();
      return newProj;
    } catch (err) {
      console.error("Failed to create project", err);
      throw err;
    }
  };

  const setActiveProjectKey = (key: string | null) => {
    setActiveProjectKeyInternal(key);
    if (key) {
      localStorage.setItem("bl_active_project_key", key);
    } else {
      localStorage.removeItem("bl_active_project_key");
    }
  };

  const activeProject = projects.find((p) => p.key === activeProjectKey) || null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        projects,
        activeProject,
        setActiveProjectKey,
        setCurrentUser,
        addProject,
        refreshProjects,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
