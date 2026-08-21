/**
 * Core utility functions for the Heylo application.
 * All shared helpers live here — pure functions with no side effects.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// ─── Tailwind class merging ──────────────────────────────────────────────────

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date / time ─────────────────────────────────────────────────────────────

/** Format a date string or Date object with a given pattern */
export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

/** Relative time string e.g. "3 hours ago" */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Smart label: "Today", "Yesterday", or e.g. "Jan 5" */
export function smartDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/** Convert "HH:MM" 24h to "h:MM AM/PM" */
export function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// ─── Currency ────────────────────────────────────────────────────────────────

/** Format cents to a localized currency string (e.g. 7500 → "$75") */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── String helpers ───────────────────────────────────────────────────────────

/** Truncate to max length with an ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/** Get initials from a full name (max 2 chars) */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Capitalize the first character */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert a camelCase or snake_case string to Title Case */
export function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .map(capitalize)
    .join(" ");
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Convert a value to a 0–100 percentage */
export function toPercent(value: number, max: number): number {
  return clamp((value / max) * 100, 0, 100);
}

/** Format a large number with K/M suffix */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Async helpers ────────────────────────────────────────────────────────────

/** Simulate network latency in mock services */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── ID generation ───────────────────────────────────────────────────────────

/** Generate a short random alphanumeric ID (for mock data) */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Greeting ────────────────────────────────────────────────────────────────

/** Return a time-appropriate greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Storage ──────────────────────────────────────────────────────────────────

/** Safely parse JSON from localStorage, returning fallback on error */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** True when running in a browser (guards SSR) */
export const isBrowser = typeof window !== "undefined";
