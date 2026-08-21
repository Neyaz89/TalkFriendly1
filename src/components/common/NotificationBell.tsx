"use client";

/**
 * NotificationBell — dropdown with recent notifications.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle2, Calendar, MessageSquare, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: "checkin" | "event" | "message" | "community";
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "checkin",
    title: "Daily check-in reminder",
    description: "How are you feeling today? Take 2 minutes to check in.",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n2",
    type: "event",
    title: "Upcoming: Morning Anxiety Circle",
    description: "Your circle starts in 2 hours.",
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "n3",
    type: "community",
    title: "New post in Burnout Recovery",
    description: "Someone replied to your post.",
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n4",
    type: "message",
    title: "Dr. Sarah Chen confirmed your session",
    description: "Session on " + formatDate(new Date(Date.now() + 86400000), "MMM d at h:mm a"),
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const TYPE_ICONS = {
  checkin: CheckCircle2,
  event: Calendar,
  message: MessageSquare,
  community: Users,
};

const TYPE_COLORS = {
  checkin: "bg-orange-100 text-orange-600",
  event: "bg-blue-100 text-blue-600",
  message: "bg-green-100 text-green-600",
  community: "bg-purple-100 text-purple-600",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="p-2 rounded-xl text-muted hover:text-text hover:bg-secondary transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-4 w-4 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center font-bold"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-large border border-border z-40 overflow-hidden"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-muted mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm text-muted">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = TYPE_ICONS[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
                          !notification.isRead ? "bg-primary-50/40" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[notification.type]}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p
                              className={`text-xs font-semibold leading-tight ${
                                !notification.isRead ? "text-text" : "text-muted"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <button
                              onClick={() => dismiss(notification.id)}
                              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-text transition-all"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted/60 mt-0.5">
                            {formatDate(notification.createdAt, "h:mm a")}
                          </p>
                        </div>

                        {/* Unread dot */}
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
