"use client";

/**
 * EmptyState component.
 * Displays a friendly message when there's no content to show.
 */

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      {emoji && (
        <span className="text-5xl mb-4" aria-hidden="true">
          {emoji}
        </span>
      )}
      {icon && !emoji && (
        <div className="mb-4 text-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </motion.div>
  );
}
