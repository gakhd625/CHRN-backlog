"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Layers,
  CheckCheck,
  Trash2,
  ListTodo,
  BookOpen,
  Folder,
  MessageSquare,
  User as UserIcon,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  notificationRepository,
  searchService,
  Notification,
  SearchResult,
} from "@/services";
import UserMenu from "./UserMenu";
import styles from "./TopNavigation.module.css";

interface TopNavigationProps {
  onToggleSidebar?: () => void;
}

export default function TopNavigation({ onToggleSidebar }: TopNavigationProps) {
  const router = useRouter();
  const { activeProject, currentUser } = useApp();

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(loadNotifications, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Live Search trigger
  useEffect(() => {
    const runSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }
      try {
        const results = await searchService.search(searchQuery, {
          projectId: activeProject?.key,
        });
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Search failed", err);
      }
    };

    const timer = setTimeout(runSearch, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, activeProject]);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
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
    setShowNotifDropdown(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleSearchResultClick = (res: SearchResult) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    router.push(res.link);
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "issue": return <ListTodo size={14} style={{ color: "var(--accent-color)" }} />;
      case "wiki": return <BookOpen size={14} style={{ color: "#10b981" }} />;
      case "file": return <Folder size={14} style={{ color: "#f59e0b" }} />;
      case "comment": return <MessageSquare size={14} style={{ color: "#8b5cf6" }} />;
      case "project": return <Layers size={14} style={{ color: "#ec4899" }} />;
      default: return <Search size={14} />;
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
        {/* Live Search Bar */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search issues, wiki, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Popover */}
          {showSearchDropdown && (
            <div
              className="animate-fade-in"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                width: "360px",
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
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border-color)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                Search Results ({searchResults.length})
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No results found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map((res) => (
                    <div
                      key={`${res.type}-${res.id}`}
                      onClick={() => handleSearchResultClick(res)}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-color)",
                        cursor: "pointer",
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <div style={{ marginTop: "3px" }}>{getTypeIcon(res.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {res.title}
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {res.snippet}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bell Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
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
          {showNotifDropdown && (
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
