"use client";

import React from "react";
import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <span className={styles.message}>{message}</span>
    </div>
  );
}
