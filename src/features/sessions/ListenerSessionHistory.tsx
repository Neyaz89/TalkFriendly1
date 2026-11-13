"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import type { ListenerSessionHistory as HistoryType } from "@/types/session-tracking.types";
import { formatDuration, formatDurationHours } from "@/lib/session-duration-utils";

interface ListenerSessionHistoryProps {
  listenerId: string;
  limit?: number;
}

export function ListenerSessionHistory({ 
  listenerId,
  limit = 10 
}: ListenerSessionHistoryProps) {
  const [history, setHistory] = useState<HistoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/sessions/listener-history?listener_id=${listenerId}&limit=${limit}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch session history');
        }

        setHistory(data);
      } catch (error: any) {
        console.error('Error fetching session history:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [listenerId, limit]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (!history || history.total_sessions === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No session history available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Session Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Sessions */}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sessions</div>
            <div className="text-2xl font-bold">{history.total_sessions}</div>
          </div>

          {/* Completed */}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">{history.completed_sessions}</div>
          </div>

          {/* Total Hours */}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</div>
            <div className="text-2xl font-bold">{history.total_hours.toFixed(1)}</div>
          </div>

          {/* Average Duration */}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Duration</div>
            <div className="text-2xl font-bold">{history.average_session_duration_minutes} min</div>
          </div>
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Sessions</h3>
        <div className="space-y-3">
          {history.recent_sessions.map((session) => (
            <div
              key={session.appointment_id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{session.user_name}</span>
                </div>
                <Badge variant={
                  session.status === 'completed' ? 'success' :
                  session.status === 'in_progress' ? 'warning' :
                  'secondary'
                }>
                  {session.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                {/* Scheduled Time */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(session.scheduled_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Duration */}
                {session.duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(session.duration_minutes)}</span>
                  </div>
                )}
              </div>

              {/* Overlapping Duration */}
              {session.overlapping_duration_minutes && session.overlapping_duration_minutes > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Billable duration (both present):
                    </span>
                    <span className="font-mono font-semibold text-green-600">
                      {formatDuration(session.overlapping_duration_minutes)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Indicator */}
      {history.completed_sessions > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="font-semibold">
                {Math.round((history.completed_sessions / history.total_sessions) * 100)}% Completion Rate
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {history.completed_sessions} of {history.total_sessions} sessions completed
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
