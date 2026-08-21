/**
 * PageHeader component.
 * Consistent header pattern used across app pages.
 */

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{title}</h1>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
