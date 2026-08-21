/**
 * Textarea component — multi-line text input.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text",
            "placeholder:text-muted resize-none transition-all",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400 focus:ring-red-200",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
