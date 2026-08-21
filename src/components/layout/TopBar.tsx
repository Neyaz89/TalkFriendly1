"use client";

/**
 * Top bar for mobile screens — logo, notifications, and avatar.
 * Updated to use Supabase user_metadata for avatar and name.
 */

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/common/NotificationBell";
import { ROUTES } from "@/constants";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-border z-20 sticky top-0">
      {/* Logo */}
      <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="32" height="32" rx="8" fill="#8B6F47"/>
          <path d="M10 10h4v4h-4z" fill="#F5F1E8" opacity="0.9"/>
          <path d="M18 10h4v4h-4z" fill="#F5F1E8" opacity="0.9"/>
          <path d="M10 18c0-4 2-6 6-6s6 2 6 6" stroke="#F5F1E8" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="font-bold text-lg text-text">TalkFriendly</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-xl text-muted hover:text-text hover:bg-secondary transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <NotificationBell />
        <Link href={ROUTES.PROFILE} className="ml-1">
          <Avatar 
            src={user?.user_metadata?.avatar_url} 
            name={user?.user_metadata?.full_name || user?.email || ""} 
            size="sm" 
          />
        </Link>
      </div>
    </header>
  );
}
