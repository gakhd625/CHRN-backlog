"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, Bell, Layers } from "lucide-react";
import { useApp } from "@/context/AppContext";
import UserMenu from "./UserMenu";
import styles from "./TopNavigation.module.css";

interface TopNavigationProps {
  onToggleSidebar?: () => void;
}

export default function TopNavigation({ onToggleSidebar }: TopNavigationProps) {
  const { activeProject } = useApp();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
              marginRight: "4px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <Link href="/" className={styles.logoContainer}>
          <Layers className={styles.logoIcon} size={24} />
          <span>ChronoBacklog</span>
        </Link>
        {activeProject && (
          <span className={styles.projectBadge}>
            {activeProject.name} ({activeProject.key})
          </span>
        )}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search issues, wiki..."
            className={styles.searchInput}
          />
        </div>

        <button className={styles.notificationButton} aria-label="Notifications">
          <Bell size={18} />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
