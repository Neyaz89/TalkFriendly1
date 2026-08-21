/**
 * useToast hook.
 * Simple toast notification state management.
 */

import { useState, useCallback } from "react";

interface ToastState {
  open: boolean;
  title?: string;
  description?: string;
  variant?: "success" | "error" | "info" | "default";
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ open: false });

  const showToast = useCallback(
    (options: Omit<ToastState, "open">) => {
      setToast({ ...options, open: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const success = useCallback(
    (title: string, description?: string) =>
      showToast({ title, description, variant: "success" }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      showToast({ title, description, variant: "error" }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      showToast({ title, description, variant: "info" }),
    [showToast]
  );

  return { toast, showToast, hideToast, success, error, info };
}
