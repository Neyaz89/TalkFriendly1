"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import { formatDuration } from "@/lib/session-duration-utils";

interface SessionListItem {
  appointment_id: string;
  listener_name: string;
  user_name: string;
  scheduled_time: string;
  appointment_status: string;
  listener_checked_in: boolean;
  user_checked_in: boolean;
  listener_duration_minutes: number | null;
  user_duration_minutes: number | null;
  overlapping_duration_minutes: number | null;
  has_anomalies: boolean;
}

interface AdminSessionListProps {
  onViewDetails?: (appointmentId: string) => void;
}

export function AdminSessionList({ onViewDetails }: AdminSessionListProps) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (anomaliesOnly) params.append('anomalies_only', 'true');

      const response = await fetch(`/api/admin/sessions/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }

      setSessions(data.sessions);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, statusFilter, anomaliesOnly]);

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      session.listener_name.toLowerCase().includes(search) ||
      session.user_name.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by listener or user name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Anomalies Filter */}
          <Button
            variant={anomaliesOnly ? "default" : "outline"}
            onClick={() => setAnomaliesOnly(!anomaliesOnly)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {anomaliesOnly ? 'Show All' : 'Anomalies Only'}
          </Button>
        </div>
      </Card>

      {/* Sessions List */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Sessions ({total})</h3>
        
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.appointment_id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{session.listener_name}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium">{session.user_name}</span>
                      
                      {session.has_anomalies && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Anomaly
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Scheduled:</span>{' '}
                        {new Date(session.scheduled_time).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant="secondary" className="ml-1">
                          {session.appointment_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Listener:</span>{' '}
                        {session.listener_checked_in ? (
                          session.listener_duration_minutes ? (
                            formatDuration(session.listener_duration_minutes)
                          ) : (
                            'Active'
                          )
                        ) : (
                          'Not checked in'
                        )}
                      </div>
                      <div>
                        <span className="font-medium">User:</span>{' '}
                        {session.user_checked_in ? (
                          session.user_duration_minutes ? (
                            formatDuration(session.user_duration_minutes)
                          ) : (
                            'Active'
                          )
                        ) : (
                          'Not checked in'
                        )}
                      </div>
                    </div>

                    {session.overlapping_duration_minutes !== null && session.overlapping_duration_minutes > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Billable: <span className="font-mono font-semibold text-green-600">
                            {formatDuration(session.overlapping_duration_minutes)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(session.appointment_id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
