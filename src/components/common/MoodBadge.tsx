/**
 * MoodBadge component.
 * Displays mood level with appropriate color coding.
 */

import React from "react";
import { cn } from "@/lib/utils";
import type { MoodLevel } from "@/types";
import { MOOD_LABELS } from "@/types/mood.types";
import { MOOD_EMOJIS } from "@/constants";

interface MoodBadgeProps {
  mood: MoodLevel;
  showEmoji?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MOOD_STYLES: Record<MoodLevel, string> = {
  1: "bg-red-100 text-red-700 border-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-200",
  3: "bg-amber-100 text-amber-700 border-amber-200",
  4: "bg-green-100 text-green-700 border-green-200",
  5: "bg-blue-100 text-blue-700 border-blue-200",
};

const SIZE_STYLES = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function MoodBadge({
  mood,
  showEmoji = true,
  showLabel = true,
  size = "sm",
  className,
}: MoodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        MOOD_STYLES[mood],
        SIZE_STYLES[size],
        className
      )}
    >
      {showEmoji && <span aria-hidden="true">{MOOD_EMOJIS[mood]}</span>}
      {showLabel && <span>{MOOD_LABELS[mood]}</span>}
    </span>
  );
}
