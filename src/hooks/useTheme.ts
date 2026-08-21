/**
 * useTheme hook — wrapper for our custom theme context
 */

"use client";

import { useTheme as useThemeContext } from "@/contexts/ThemeContext";

export function useTheme() {
  return useThemeContext();
}
