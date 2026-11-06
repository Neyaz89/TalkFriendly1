'use client';

/**
 * ProfileCard Component
 * Displays user profile with connection status and actions
 */

import { useState } from 'react';
import Image from 'next/image';
import { User, MessageCircle, Check, X, Clock, UserPlus } from 'lucide-react';
import type { UserProfileCard } from '@/types';

interface ProfileCardProps {
  profile: UserProfileCard;
  onConnectionAction?: (action: 'send' | 'accept' | 'reject' | 'remove') => void;
  onMessageClick?: () => void;
  showActions?: boolean;
}

export default function ProfileCard({
  profile,
  onConnectionAction,
  onMessageClick,
  showActions = true,
}: ProfileCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectionAction = async (
    action: 'send' | 'accept' | 'reject' | 'remove'
  ) => {
    setIsLoading(true);
    try {
      if (onConnectionAction) {
        await onConnectionAction(action);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderConnectionButton = () => {
    if (!showActions) return null;

    switch (profile.connection_status) {
      case 'none':
        return (
          <button
            onClick={() => handleConnectionAction('send')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Connect
          </button>
        );

      case 'pending_sent':
        return (
          <button
            onClick={() => handleConnectionAction('remove')}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock className="w-4 h-4" />
            Pending
          </button>
        );

      case 'pending_received':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleConnectionAction('accept')}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => handleConnectionAction('reject')}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        );

      case 'connected':
        return (
          <div className="flex gap-2">
            <button
              onClick={onMessageClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            <button
              onClick={() => handleConnectionAction('remove')}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Remove
            </button>
          </div>
        );

      case 'blocked':
        return (
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
            Blocked
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Avatar and Basic Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-gray-900">
            {profile.full_name || profile.username}
          </div>
          <p className="text-sm text-gray-500">@{profile.username}</p>

          {/* Role Badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.role === 'listener'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {profile.role === 'listener' ? '🎧 Listener' : '👤 User'}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{profile.bio}</p>
      )}

      {/* Stats */}
      {profile.stats && (
        <div className="flex gap-4 mb-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-900">
              {profile.stats.total_connections}
            </span>{' '}
            connections
          </div>
          {profile.role === 'listener' && profile.stats.listener_rating && (
            <div>
              <span className="font-semibold text-gray-900">
                {profile.stats.listener_rating.toFixed(1)}
              </span>{' '}
              ⭐ rating
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end">{renderConnectionButton()}</div>
    </div>
  );
}
