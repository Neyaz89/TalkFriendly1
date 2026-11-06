'use client';

/**
 * ConnectionsList Component
 * Displays list of user's connections
 */

import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import ProfileCard from './ProfileCard';
import type { UserConnectionWithProfile } from '@/types';
import { useRouter } from 'next/navigation';

export default function ConnectionsList() {
  const router = useRouter();
  const [connections, setConnections] = useState<UserConnectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections/list?status=accepted');
      
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      setConnections(data.connections);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/connections/remove?connection_id=${connectionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove connection');
      }

      // Refresh list
      fetchConnections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMessageClick = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchConnections}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No connections yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start connecting with other users to build your network
        </p>
        <button
          onClick={() => router.push('/connections/search')}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Find People
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {connections.map((connection) => (
        <ProfileCard
          key={connection.id}
          profile={{
            ...connection.connected_user,
            connection_status: 'connected',
            connection_id: connection.id,
          }}
          onConnectionAction={(action) => {
            if (action === 'remove') {
              handleRemoveConnection(connection.id);
            }
          }}
          onMessageClick={() =>
            handleMessageClick(connection.connected_user.id)
          }
        />
      ))}
    </div>
  );
}
