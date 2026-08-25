"use client";

import React, { useState } from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";
import styles from "./MainLayout.module.css";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layoutContainer}>
      <TopNavigation onToggleSidebar={toggleSidebar} />
      <div className={styles.mainWrapper}>
        {/* Backdrop for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div className={styles.backdrop} onClick={closeSidebar} />
        )}
        <Sidebar isOpen={isSidebarOpen} onCloseMobile={closeSidebar} />
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
