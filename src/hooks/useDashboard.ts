/**
 * Dashboard hooks with React Query caching
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => dashboardService.getDashboard(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity,
    queryFn: () => dashboardService.getDashboard(),
    staleTime: 1000 * 60 * 3,
  });
}
