/**
 * useDebounce hook.
 * Delays updating a value until after a specified wait period.
 * Used for search inputs to avoid spamming API calls.
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
