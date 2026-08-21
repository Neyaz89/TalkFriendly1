"use client";

/**
 * Mobile bottom navigation bar — 5 primary destinations.
 * Shown only on screens smaller than md breakpoint.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, BookOpen, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

const MOBILE_NAV_ITEMS = [
  { label: "Home",      href: ROUTES.DASHBOARD,    icon: Home     },
  { label: "AI",        href: ROUTES.AI,            icon: Sparkles },
  { label: "Journal",   href: ROUTES.JOURNAL,       icon: BookOpen },
  { label: "Community", href: ROUTES.COMMUNITIES,   icon: Users    },
  { label: "Profile",   href: ROUTES.PROFILE,       icon: User     },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {MOBILE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === ROUTES.DASHBOARD
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors",
                isActive ? "text-primary-500" : "text-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("h-5 w-5 transition-transform", isActive && "scale-110")}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
