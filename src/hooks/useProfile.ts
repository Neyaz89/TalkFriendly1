/**
 * useProfile hook.
 * Fetches the current user profile with loading/error states.
 */

import { useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { profileService } from "@/services/profile.service";

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    profileService
      .getProfile()
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setIsLoading(false));
  }, [tick]);

  return { profile, isLoading, error, refetch: () => setTick((n) => n + 1) };
}
