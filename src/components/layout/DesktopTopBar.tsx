"use client";

/**
 * Desktop top bar — shown above main content area on md+ screens.
 * Breadcrumb, notifications, and quick profile access.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/common/NotificationBell";
import { ROUTES } from "@/constants";
import { capitalize } from "@/lib/utils";

/** Derives a human-readable page title from the pathname */
function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  const MAP: Record<string, string> = {
    dashboard: "Dashboard",
    checkin: "Daily Check-in",
    ai: "AI Companion",
    journal: "Journal",
    new: "New Entry",
    moods: "Mood Analytics",
    communities: "Communities",
    listeners: "Listeners",
    circles: "Listening Circles",
    events: "Events",
    affirmations: "Affirmations",
    matching: "Find Your People",
    profile: "Profile",
    settings: "Settings",
    book: "Book a Session",
  };
  return MAP[segment] ?? capitalize(segment);
}

export function DesktopTopBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b border-border sticky top-0 z-20">
      {/* Page title / breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">TalkFriendly</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        <span className="font-semibold text-text">{pageTitle}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-border text-sm text-muted hover:border-primary/40 hover:bg-primary-50 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden lg:block">Search…</span>
          <kbd className="hidden lg:block text-xs bg-white border border-border rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar */}
        <Link href={ROUTES.PROFILE}>
          <Avatar
            src={user?.user_metadata?.avatar_url}
            name={user?.user_metadata?.full_name || user?.email || ''}
            size="sm"
            className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
          />
        </Link>
      </div>
    </header>
  );
}
