/**
 * Toast notification component.
 * Provides feedback for user actions (success, error, info).
 */

"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info" | "default";
  open: boolean;
  onClose: () => void;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: "bg-green-50 border-green-200 text-green-800",
    iconClass: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-50 border-red-200 text-red-800",
    iconClass: "text-red-500",
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClass: "text-blue-500",
  },
  default: {
    icon: Info,
    className: "bg-white border-border text-text",
    iconClass: "text-primary",
  },
};

export function Toast({ title, description, variant = "default", open, onClose }: ToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        open={open}
        onOpenChange={(v) => !v && onClose()}
        className={cn(
          "flex items-start gap-3 p-4 rounded-2xl border shadow-large",
          "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out",
          "max-w-sm w-full",
          config.className
        )}
        duration={4000}
      >
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {title && (
            <ToastPrimitive.Title className="text-sm font-semibold">
              {title}
            </ToastPrimitive.Title>
          )}
          {description && (
            <ToastPrimitive.Description className="text-sm mt-0.5 opacity-80">
              {description}
            </ToastPrimitive.Description>
          )}
        </div>
        <ToastPrimitive.Close
          onClick={onClose}
          className="shrink-0 rounded-lg p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>

      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}
