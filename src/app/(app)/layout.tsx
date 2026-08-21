"use client";

/**
 * Protected app layout.
 * Redirects unauthenticated users to login.
 * All pages inside (app)/ require authentication.
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/constants";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth state
  if (loading) {
    return <PageLoader message="Loading your space…" />;
  }

  // Prevent flash of protected content before redirect
  if (!user) {
    return <PageLoader message="Redirecting…" />;
  }

  return <AppLayout>{children}</AppLayout>;
}
