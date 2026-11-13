"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  Edit2, 
  Save,
  X,
  Loader2,
  User,
  Calendar,
} from "lucide-react";
import { formatDuration } from "@/lib/session-duration-utils";
import { useToast } from "@/hooks/useToast";
import type { ParticipantSession } from "@/types/session-tracking.types";

interface AdminSessionDetailsProps {
  appointmentId: string;
  onClose?: () => void;
}

interface SessionDetails {
  appointment_id: string;
  listener_name: string;
  user_name: string;
  scheduled_time: string;
  listener_sessions: ParticipantSession[];
  user_sessions: ParticipantSession[];
  overlapping_duration_minutes: number;
  requires_review: boolean;
  review_notes: string | null;
  anomalies: any[];
  warnings: string[];
}

export function AdminSessionDetails({ appointmentId, onClose }: AdminSessionDetailsProps) {
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newJoinedAt, setNewJoinedAt] = useState('');
  const [newLeftAt, setNewLeftAt] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sessions/details?appointment_id=${appointmentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session details');
      }

      setDetails(data);
    } catch (error: any) {
      console.error('Error fetching details:', error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [appointmentId]);

  const handleEditSession = (session: ParticipantSession) => {
    setEditingSessionId(session.id);
    setNewJoinedAt(session.joined_at);
    setNewLeftAt(session.left_at || '');
    setAdjustmentReason('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setNewJoinedAt('');
    setNewLeftAt('');
    setAdjustmentReason('');
  };

  const handleSaveAdjustment = async (sessionId: string) => {
    if (!adjustmentReason.trim()) {
      showError('Please provide a reason for the adjustment');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/sessions/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          joined_at: newJoinedAt,
          left_at: newLeftAt || undefined,
          reason: adjustmentReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust session');
      }

      success('Session adjusted successfully');
      handleCancelEdit();
      await fetchDetails(); // Refresh
    } catch (error: any) {
      console.error('Error adjusting session:', error);
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!details) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-red-600">
          Failed to load session details
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Session Details</h2>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(details.scheduled_time).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Participants */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Listener</div>
              <div className="font-semibold">{details.listener_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">User</div>
              <div className="font-semibold">{details.user_name}</div>
            </div>
          </div>
        </div>

        {/* Overlapping Duration */}
        {details.overlapping_duration_minutes > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800 dark:text-green-200">
                Billable Duration (both present):
              </span>
              <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                {formatDuration(details.overlapping_duration_minutes)}
              </span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {details.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Anomalies Detected
                </div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {details.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Listener Sessions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Listener Sessions</h3>
        {details.listener_sessions.length === 0 ? (
          <p className="text-gray-500">Listener has not checked in</p>
        ) : (
          <div className="space-y-3">
            {details.listener_sessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-lg">
                {editingSessionId === session.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <Label>Check-in Time</Label>
                      <Input
                        type="datetime-local"
                        value={newJoinedAt.substring(0, 16)}
                        onChange={(e) => setNewJoinedAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Check-out Time</Label>
                      <Input
                        type="datetime-local"
                        value={newLeftAt ? newLeftAt.substring(0, 16) : ''}
                        onChange={(e) => setNewLeftAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Reason for Adjustment *</Label>
                      <Textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Explain why this adjustment is needed..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveAdjustment(session.id)}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-1" /> Save</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Check-in:</span>{' '}
                          {new Date(session.joined_at).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Check-out:</span>{' '}
                          {session.left_at ? new Date(session.left_at).toLocaleString() : 'Still checked in'}
                        </div>
                        {session.duration_seconds && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>{' '}
                            {formatDuration(Math.floor(session.duration_seconds / 60))}
                          </div>
                        )}
                        <div>
                          <Badge variant={session.source === 'manual_check_in' ? 'default' : 'secondary'}>
                            {session.source}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* User Sessions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">User Sessions</h3>
        {details.user_sessions.length === 0 ? (
          <p className="text-gray-500">User has not checked in</p>
        ) : (
          <div className="space-y-3">
            {details.user_sessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-lg">
                {editingSessionId === session.id ? (
                  // Edit Mode (same as listener)
                  <div className="space-y-3">
                    <div>
                      <Label>Check-in Time</Label>
                      <Input
                        type="datetime-local"
                        value={newJoinedAt.substring(0, 16)}
                        onChange={(e) => setNewJoinedAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Check-out Time</Label>
                      <Input
                        type="datetime-local"
                        value={newLeftAt ? newLeftAt.substring(0, 16) : ''}
                        onChange={(e) => setNewLeftAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Reason for Adjustment *</Label>
                      <Textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Explain why this adjustment is needed..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveAdjustment(session.id)}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-1" /> Save</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Check-in:</span>{' '}
                          {new Date(session.joined_at).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Check-out:</span>{' '}
                          {session.left_at ? new Date(session.left_at).toLocaleString() : 'Still checked in'}
                        </div>
                        {session.duration_seconds && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>{' '}
                            {formatDuration(Math.floor(session.duration_seconds / 60))}
                          </div>
                        )}
                        <div>
                          <Badge variant={session.source === 'manual_check_in' ? 'default' : 'secondary'}>
                            {session.source}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
