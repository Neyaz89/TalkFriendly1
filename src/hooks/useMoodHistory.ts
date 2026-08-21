/**
 * useMoodHistory hook.
 * Fetches and caches mood history data.
 */

import { useState, useEffect } from "react";
import type { MoodHistory } from "@/types";
import { moodService } from "@/services/mood.service";

interface UseMoodHistoryReturn {
  history: MoodHistory | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMoodHistory(): UseMoodHistoryReturn {
  const [history, setHistory] = useState<MoodHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    moodService
      .getMoods()
      .then((data) => {
        setHistory(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load mood history");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tick]);

  const refetch = () => setTick((n) => n + 1);

  return { history, isLoading, error, refetch };
}
