"use client";

/**
 * React Query Provider wrapper
 * Provides caching and state management for the entire application
 */

import { QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';

interface QueryClientProviderProps {
  children: React.ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {/* DevTools removed - optional package not installed */}
      {/* To add devtools: npm install -D @tanstack/react-query-devtools */}
    </TanstackQueryClientProvider>
  );
}
