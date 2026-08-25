"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { useApp } from "@/context/AppContext";
import styles from "./UserMenu.module.css";

export default function UserMenu() {
  const { currentUser, setCurrentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!currentUser) return null;

  const initials = currentUser.name
    ? currentUser.name.substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.avatarButton}
        aria-label="User menu"
      >
        <div className={styles.avatar}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} />
          ) : (
            initials
          )}
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{currentUser.name}</div>
            <div className={styles.userEmail}>{currentUser.email}</div>
          </div>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className={styles.menuItem}
          >
            <Settings size={16} />
            Account Settings
          </Link>

          <div className={styles.menuItem}>
            <Shield size={16} />
            Role: {currentUser.role}
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              setCurrentUser(null);
            }}
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
