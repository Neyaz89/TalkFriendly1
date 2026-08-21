/**
 * StarRating component.
 * Displays a read-only or interactive star rating.
 */

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const SIZE_MAP = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = React.useState(0);

  return (
    <div
      className={cn("flex gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = interactive
          ? starValue <= (hovered || rating)
          : starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? starValue === rating : undefined}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                SIZE_MAP[size],
                isFilled ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
