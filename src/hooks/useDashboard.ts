/**
 * Dashboard hooks with React Query caching
 * Manages dashboard statistics and recent activity
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { dashboardService } from '@/services/dashboard.service';

/**
 * Get dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Get recent activity feed
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity,
    queryFn: () => dashboardService.getRecentActivity(),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}
