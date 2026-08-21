"use client";

/**
 * PwaInstallBanner — shows a native-style install prompt for the PWA.
 * Appears once on mobile after 30 seconds, stored in localStorage to not repeat.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage("talkfriendly_pwa_dismissed", false);

  useEffect(() => {
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so it doesn't interrupt the initial experience
      setTimeout(() => setShowBanner(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
        >
          <div className="bg-white rounded-2xl shadow-large border border-border p-4 flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Add TalkFriendly to Home Screen</p>
              <p className="text-xs text-muted mt-0.5">
                Get the full app experience — offline access, faster load times.
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-lg text-muted hover:text-text hover:bg-gray-100 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action bar */}
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDismiss}
            >
              Not now
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              Install
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
