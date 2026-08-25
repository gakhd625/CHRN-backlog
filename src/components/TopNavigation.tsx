"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, Layers, CheckCheck, Trash2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { notificationRepository, Notification } from "@/services";
import UserMenu from "./UserMenu";
import styles from "./TopNavigation.module.css";

interface TopNavigationProps {
  onToggleSidebar?: () => void;
}

export default function TopNavigation({ onToggleSidebar }: TopNavigationProps) {
  const router = useRouter();
  const { activeProject, currentUser } = useApp();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const list = await notificationRepository.getByUser(currentUser.id);
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 4000); // refresh every 4s
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await notificationRepository.markAllAsRead(currentUser.id);
    await loadNotifications();
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    await notificationRepository.clearAll(currentUser.id);
    await loadNotifications();
  };

  const handleNotificationClick = async (notif: Notification) => {
    await notificationRepository.markAsRead(notif.id);
    await loadNotifications();
    setShowDropdown(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

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

      <div className={styles.rightSection} style={{ position: "relative" }}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search issues, wiki..."
            className={styles.searchInput}
          />
        </div>

        {/* Bell Notifications */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={styles.notificationButton}
            aria-label="Notifications"
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "var(--priority-high)",
                  color: "#ffffff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {showDropdown && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "340px",
                maxHeight: "420px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={16} style={{ color: "var(--accent-color)" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "var(--accent-light)",
                        color: "var(--accent-color)",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        fontWeight: 600,
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      title="Mark all as read"
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Clear all"
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Items List */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border-color)",
                        cursor: "pointer",
                        backgroundColor: notif.isRead ? "transparent" : "var(--accent-light)",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (notif.isRead) e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        if (notif.isRead) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
