/**
 * Enhanced profile hooks with React Query caching
 * Provides optimized profile data fetching and updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Get current user's profile with caching
 */
export function useCurrentProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: () => profileService.getProfile(),
    staleTime: 1000 * 60 * 10, // 10 minutes - profile data changes infrequently
    retry: 2,
  });
}

/**
 * Get a specific user's profile by ID with caching
 */
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId || ''),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 minutes - other users' profiles change rarely
  });
}

/**
 * Get profile statistics with caching
 */
export function useProfileStats(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile.stats(userId || ''),
    queryFn: async () => {
      const supabase = createClient();
      
      // Get journal count
      const { count: journalCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get mood logs count
      const { count: moodLogsCount } = await supabase
        .from('mood_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Calculate streak
      const { data: moods } = await supabase
        .from('mood_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      let streak = 0;
      if (moods && moods.length > 0) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const mood of moods) {
          const moodDate = new Date(mood.created_at);
          moodDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((currentDate.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === streak) {
            streak++;
            currentDate = moodDate;
          } else {
            break;
          }
        }
      }

      return {
        journalCount: journalCount || 0,
        moodLogsCount: moodLogsCount || 0,
        streak,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes - stats can change more frequently
  });
}

/**
 * Update profile settings with optimistic updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: any) => profileService.updateSettings(updates),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.current });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(queryKeys.profile.current);

      // Optimistically update
      queryClient.setQueryData(queryKeys.profile.current, (old: any) => ({
        ...old,
        settings: { ...old?.settings, ...updates },
      }));

      return { previousProfile };
    },
    onError: (_error, _updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profile.current, context.previousProfile);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
    },
  });
}

/**
 * Update profile information (name, bio, etc.)
 */
export function useUpdateProfileInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { 
      full_name?: string; 
      username?: string; 
      bio?: string; 
      profession?: string;
      avatar_url?: string;
    }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({
        data: updates,
      });

      return updates;
    },
    onSuccess: () => {
      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
    },
  });
}
