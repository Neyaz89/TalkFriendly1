"use client";

import { useState, useEffect } from "react";
import { blockService } from "@/services/block.service";
import type { BlockedUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { 
  ShieldOff, 
  Eye, 
  MessageCircle, 
  Users,
  Lock,
  Unlock
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

export function PrivacySettings() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const data = await blockService.getBlockedUsers();
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      showToast('error', 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    setUnblocking(userId);

    try {
      await blockService.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== userId));
      showToast('success', 'User unblocked successfully');
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      showToast('error', error.message || 'Failed to unblock user');
    } finally {
      setUnblocking(null);
    }
  };

  if (loading) {
    return <PageLoader message="Loading privacy settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy & Security
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your privacy settings and blocked users
          </p>
        </div>

        {/* Privacy Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Privacy Controls
          </h2>

          {/* Who can see your profile */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Profile Visibility
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Control who can see your profile and posts
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Everyone
            </Button>
          </div>

          {/* Who can message you */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Messages
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Who can send you direct messages
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Connections only
            </Button>
          </div>

          {/* Who can send connection requests */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Connection Requests
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Who can send you connection requests
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Everyone
            </Button>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Blocked Users
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
              </p>
            </div>
            <ShieldOff className="h-6 w-6 text-red-500" />
          </div>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                You haven't blocked anyone yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map(block => {
                const user = block.blocked_user;
                if (!user) return null;

                return (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        src={user.avatar_url || undefined}
                        name={user.full_name || user.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Blocked {formatDistanceToNow(new Date(block.created_at), { addSuffix: true })}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                            Reason: {block.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user.id)}
                      disabled={unblocking === user.id}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      {unblocking === user.id ? 'Unblocking...' : 'Unblock'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Security
          </h2>

          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              Download Your Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
