"use client";

import { useState, useEffect } from "react";
import { connectionService } from "@/services/connection.service";
import type { ConnectionRequestWithProfile } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X, Bell } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

export function ConnectionRequestsCard() {
  const [requests, setRequests] = useState<ConnectionRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { success, error } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await connectionService.getReceivedRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      await connectionService.acceptRequest(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      success( 'Connection request accepted!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      error( error.message || 'Failed to accept request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      await connectionService.rejectRequest(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      success( 'Connection request rejected');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      error( error.message || 'Failed to reject request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Connection Requests
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {requests.length} {requests.length === 1 ? 'person wants' : 'people want'} to connect with you
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {requests.map(request => {
          const sender = request.sender_profile;
          if (!sender) return null;

          const isProcessing = processingIds.has(request.id);

          return (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link href={`/profile/${sender.id}`}>
                  <Avatar
                    src={sender.avatar_url || undefined}
                    name={sender.full_name || sender.username}
                    size="md"
                    className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${sender.id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
                    >
                      {sender.full_name || sender.username}
                    </Link>
                    {sender.account_type === 'doctor' && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Doctor
                      </Badge>
                    )}
                  </div>
                  
                  {request.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {request.message}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleAccept(request.id)}
                  disabled={isProcessing}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
