"use client";

/**
 * Main sidebar navigation component.
 * Responsive: collapses to icon-only on small screens, drawer on mobile.
 */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Sparkles,
  BookOpen,
  Activity,
  Users,
  Headphones,
  Circle,
  Calendar,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { label: "Home", href: ROUTES.DASHBOARD, icon: Home },
  { label: "AI Companion", href: ROUTES.AI, icon: Sparkles },
  { label: "Journal", href: ROUTES.JOURNAL, icon: BookOpen },
  { label: "Moods", href: ROUTES.MOODS, icon: Activity },
  { label: "Communities", href: ROUTES.COMMUNITIES, icon: Users },
  { label: "Listeners", href: ROUTES.LISTENERS, icon: Headphones },
  { label: "Circles", href: ROUTES.CIRCLES, icon: Circle },
  { label: "Events", href: ROUTES.EVENTS, icon: Calendar },
  { label: "Affirmations", href: ROUTES.AFFIRMATIONS, icon: Heart },
  { label: "Matching", href: ROUTES.MATCHING, icon: UserSearch },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen bg-white border-r border-border sticky top-0 overflow-hidden z-30"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center mx-auto"
            >
              <Image 
                src="/images/logo.png" 
                alt="TalkFriendly" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
            </motion.div>
          ) : (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <Image 
                src="/images/logo.png" 
                alt="TalkFriendly" 
                width={40} 
                height={40}
                className="rounded-lg shrink-0"
              />
              <span className="font-bold text-xl text-black">TalkFriendly</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted hover:text-text transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin" aria-label="Main navigation">
        <ul className="space-y-0.5 px-2" role="list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : "text-muted hover:bg-gray-50 hover:text-text"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-primary-500" : "text-current"
                    )}
                    aria-hidden="true"
                  />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href={ROUTES.SETTINGS}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            "text-muted hover:bg-gray-50 hover:text-text"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {user && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl",
            isCollapsed ? "justify-center" : ""
          )}>
            <Link href={ROUTES.PROFILE}>
              <Avatar
                src={user.user_metadata?.avatar_url}
                name={user.user_metadata?.full_name || user.email || ''}
                size="sm"
                className="shrink-0 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
              />
            </Link>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-muted hover:text-text transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
