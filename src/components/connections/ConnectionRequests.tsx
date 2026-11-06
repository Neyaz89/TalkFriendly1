'use client';

/**
 * ConnectionRequests Component
 * Displays pending connection requests
 */

import { useState, useEffect } from 'react';
import { UserPlus, Loader2, Check, X } from 'lucide-react';
import Image from 'next/image';
import type { ConnectionRequest } from '@/types';

export default function ConnectionRequests() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections/requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (
    requestId: string,
    status: 'accepted' | 'rejected'
  ) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: requestId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status === 'accepted' ? 'accept' : 'reject'} request`);
      }

      // Remove from list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchRequests}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Connection Requests ({requests.length})
      </h3>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {request.from_user.avatar_url ? (
                <Image
                  src={request.from_user.avatar_url}
                  alt={request.from_user.username}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {request.from_user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">
                {request.from_user.full_name || request.from_user.username}
              </div>
              <p className="text-sm text-gray-500">
                @{request.from_user.username}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                  request.from_user.profession
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {request.from_user.profession ? `🎧 ${request.from_user.profession}` : '👤 User'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(request.id, 'accepted')}
                disabled={processingIds.has(request.id)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Accept"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleResponse(request.id, 'rejected')}
                disabled={processingIds.has(request.id)}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Reject"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
