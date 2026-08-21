"use client";

/**
 * Landing page navigation bar.
 * Sticky header with logo, nav links, and CTA buttons.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/images/logo.png" 
              alt="TalkFriendly" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-xl text-black">TalkFriendly</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Landing page navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTAs - Show different buttons based on auth state */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.DASHBOARD} className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </Button>
                <Link href={ROUTES.PROFILE}>
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    name={user.user_metadata?.full_name || user.email || ''}
                    size="sm"
                    className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
                  />
                </Link>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.LOGIN}>Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={ROUTES.REGISTER}>Start Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4 space-y-1"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            
            {/* Mobile CTAs */}
            {user ? (
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href={ROUTES.PROFILE}>Profile</Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={ROUTES.LOGIN}>Sign in</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href={ROUTES.REGISTER}>Start Free</Link>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </header>
  );
}
