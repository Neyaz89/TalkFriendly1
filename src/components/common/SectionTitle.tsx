/**
 * SectionTitle component.
 * Consistent section heading with optional subtitle and action.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  centered?: boolean;
}

export function SectionTitle({
  title,
  subtitle,
  action,
  className,
  centered = false,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 mb-5",
        centered && "flex-col text-center",
        className
      )}
    >
      <div className={centered ? "" : ""}>
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && !centered && <div className="shrink-0">{action}</div>}
    </div>
  );
}
