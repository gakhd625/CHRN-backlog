"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import LoadingState from "@/components/LoadingState";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    // Give context a small tick to load session from localStorage
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (currentUser === null && !isAuthPage) {
      router.push("/login");
    } else if (currentUser !== null && isAuthPage) {
      router.push("/");
    }
  }, [currentUser, isAuthPage, router, isReady]);

  // Show loading during initial session check
  if (!isReady) {
    return <LoadingState message="Restoring session..." />;
  }

  // If not logged in and trying to access app page, show loading while redirecting
  if (currentUser === null && !isAuthPage) {
    return <LoadingState message="Redirecting to login..." />;
  }

  // If logged in and trying to access auth page, show loading while redirecting
  if (currentUser !== null && isAuthPage) {
    return <LoadingState message="Redirecting to dashboard..." />;
  }

  return <>{children}</>;
}
