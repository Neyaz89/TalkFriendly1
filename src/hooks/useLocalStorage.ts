/**
 * useLocalStorage hook.
 * Safely reads/writes to localStorage with SSR support.
 */

import { useState, useEffect, useCallback } from "react";
import { safeJsonParse } from "@/lib/utils";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(safeJsonParse(item, initialValue));
      }
    } catch {
      // localStorage unavailable (SSR or private mode)
    }
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        // Ignore write errors
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
