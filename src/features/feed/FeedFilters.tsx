"use client";

import { Globe, Users, TrendingUp } from "lucide-react";

interface FeedFiltersProps {
  currentFilter: 'all' | 'public' | 'connections';
  onFilterChange: (filter: 'all' | 'public' | 'connections') => void;
}

export function FeedFilters({ currentFilter, onFilterChange }: FeedFiltersProps) {
  const filters = [
    { value: 'all' as const, label: 'All Posts', icon: TrendingUp },
    { value: 'public' as const, label: 'Public', icon: Globe },
    { value: 'connections' as const, label: 'Connections', icon: Users },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
      <div className="flex items-center gap-2">
        {filters.map(filter => {
          const Icon = filter.icon;
          const isActive = currentFilter === filter.value;

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 flex-1
                ${isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
