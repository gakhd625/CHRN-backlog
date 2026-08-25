"use client";

import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export default function EmptyState({
  title = "No items found",
  description = "There are no entries to display at the moment.",
  actionText,
  onAction,
  icon: Icon = FolderOpen,
}: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={32} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionText && onAction && (
        <button className={styles.actionButton} onClick={onAction}>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
