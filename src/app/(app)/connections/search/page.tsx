'use client';

/**
 * Search Users Page
 * Find and connect with other users
 */

import { useState, useEffect } from 'react';
import { Search, Loader2, Filter } from 'lucide-react';
import ProfileCard from '@/components/connections/ProfileCard';
import type { UserProfileCard } from '@/types';
import { useRouter } from 'next/navigation';

export default function SearchUsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [users, setUsers] = useState<UserProfileCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Auto-search on mount (show all users initially)
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setHasSearched(true);

      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/connections/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionAction = async (
    userId: string,
    action: 'send' | 'accept' | 'reject' | 'remove'
  ) => {
    try {
      let response;

      switch (action) {
        case 'send':
          response = await fetch('/api/connections/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_user_id: userId }),
          });
          break;

        case 'accept':
        case 'reject':
          const user = users.find((u) => u.id === userId);
          if (!user?.connection_id) return;

          response = await fetch('/api/connections/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              connection_id: user.connection_id,
              status: action === 'accept' ? 'accepted' : 'rejected',
            }),
          });
          break;

        case 'remove':
          const userToRemove = users.find((u) => u.id === userId);
          if (!userToRemove?.connection_id) return;

          response = await fetch(
            `/api/connections/remove?connection_id=${userToRemove.connection_id}`,
            { method: 'DELETE' }
          );
          break;
      }

      if (response && !response.ok) {
        throw new Error(`Failed to ${action} connection`);
      }

      // Refresh search results
      handleSearch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMessageClick = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find People
          </h1>
          <p className="text-gray-600">
            Search for users and listeners to connect with
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name or username..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="listener">Listeners</option>
              </select>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : hasSearched && users.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Found {users.length} user{users.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <ProfileCard
                  key={user.id}
                  profile={user}
                  onConnectionAction={(action) =>
                    handleConnectionAction(user.id, action)
                  }
                  onMessageClick={() => handleMessageClick(user.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
