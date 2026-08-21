/**
 * Skeleton component — loading placeholder for content.
 * Creates animated shimmer effects to indicate loading state.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text";
}

export function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-100 relative overflow-hidden",
        variant === "circle" ? "rounded-full" : "rounded-xl",
        variant === "text" ? "rounded-md h-4" : "",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

/** Skeleton for a card */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-border p-6 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

/** Skeleton for a listener card */
export function ListenerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="flex gap-4">
        <Skeleton variant="circle" className="h-16 w-16" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 rounded-xl" />
    </div>
  );
}
