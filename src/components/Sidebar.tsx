"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Folder,
  Settings,
  ChevronLeft,
  ListTodo,
  Kanban,
  BookOpen,
  FileText,
  GitBranch,
  Users,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, activeProject, setActiveProjectKey } = useApp();

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (key === "global") {
      setActiveProjectKey(null);
      router.push("/");
    } else {
      setActiveProjectKey(key);
      router.push(`/projects/${key}`);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleBackToGlobal = () => {
    setActiveProjectKey(null);
    router.push("/");
    if (onCloseMobile) onCloseMobile();
  };

  const isLinkActive = (href: string) => {
    return pathname === href;
  };

  // Define sidebar items based on active project state
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.navigationSection}>
        {activeProject ? (
          <>
            <button className={styles.backButton} onClick={handleBackToGlobal}>
              <ChevronLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <div className={styles.sectionHeader}>{activeProject.name}</div>

            <Link
              href={`/projects/${activeProject.key}`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                isLinkActive(`/projects/${activeProject.key}`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <Home size={18} className={styles.icon} />
              <span>Project Home</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/issues`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/issues`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <ListTodo size={18} className={styles.icon} />
              <span>Issues</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/board`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/board`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <Kanban size={18} className={styles.icon} />
              <span>Kanban Board</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/wiki`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/wiki`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <BookOpen size={18} className={styles.icon} />
              <span>Wiki</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/files`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/files`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <FileText size={18} className={styles.icon} />
              <span>Files</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/repo`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/repo`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <GitBranch size={18} className={styles.icon} />
              <span>Repository</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/members`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/members`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <Users size={18} className={styles.icon} />
              <span>Members</span>
            </Link>

            <Link
              href={`/projects/${activeProject.key}/settings`}
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith(`/projects/${activeProject.key}/settings`)
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <Settings size={18} className={styles.icon} />
              <span>Settings</span>
            </Link>
          </>
        ) : (
          <>
            <div className={styles.sectionHeader}>Main Menu</div>
            <Link
              href="/"
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                isLinkActive("/") ? styles.navLinkActive : ""
              }`}
            >
              <Home size={18} className={styles.icon} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/projects"
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith("/projects") &&
                !activeProject &&
                pathname !== "/projects/new"
                  ? styles.navLinkActive
                  : ""
              }`}
            >
              <Folder size={18} className={styles.icon} />
              <span>Projects</span>
            </Link>

            <Link
              href="/settings"
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith("/settings") ? styles.navLinkActive : ""
              }`}
            >
              <Settings size={18} className={styles.icon} />
              <span>Settings</span>
            </Link>

            <Link
              href="/dev"
              onClick={onCloseMobile}
              className={`${styles.navLink} ${
                pathname.startsWith("/dev") ? styles.navLinkActive : ""
              }`}
            >
              <Terminal size={18} className={styles.icon} />
              <span>Dev Tools</span>
            </Link>
          </>
        )}
      </div>

      <div className={styles.sidebarFooter}>
        <div style={{ position: "relative" }}>
          <select
            value={activeProject ? activeProject.key : "global"}
            onChange={handleProjectChange}
            className={styles.projectSwitcher}
          >
            <option value="global">Select Project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
