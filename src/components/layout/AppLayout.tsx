"use client";

/**
 * Main application shell.
 * Sidebar + DesktopTopBar + MobileTopBar + MobileNav + main content scroll area.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { DesktopTopBar } from "./DesktopTopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Right column: topbar + content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <TopBar />

        {/* Desktop header */}
        <DesktopTopBar />

        {/* Scrollable page content */}
        <main
          className="flex-1 overflow-y-auto scrollbar-thin bg-background"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            // Extra bottom padding so mobile nav doesn't cover content
            className="min-h-full pb-24 md:pb-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
