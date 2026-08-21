/**
 * Auth pages layout — centered, clean, emotionally warm.
 */

import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-2xl text-text">TalkFriendly</span>
          </Link>

          {children}
        </div>
      </div>

      {/* Right: Illustration (hidden on small screens) */}
      <div className="hidden lg:flex flex-1 bg-primary-50 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-sm">
          <div className="text-7xl mb-6">🌿</div>
          <h2 className="text-2xl font-bold text-text mb-3">
            Your mental wellness journey starts here
          </h2>
          <p className="text-muted leading-relaxed">
            Thousands of people are finding clarity, connection, and calm on TalkFriendly every day.
          </p>

          {/* Floating elements */}
          <div className="mt-8 space-y-3">
            {[
              { emoji: "😊", text: '"I finally feel understood"', name: "Sarah, 28" },
              { emoji: "🔥", text: '"14-day streak and counting"', name: "Marcus, 32" },
              { emoji: "💙", text: '"The community saved me"', name: "Priya, 24" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-card text-left"
              >
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-text">{item.text}</p>
                  <p className="text-xs text-muted">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-300/40 rounded-full blur-2xl" />
      </div>
    </div>
  );
}
