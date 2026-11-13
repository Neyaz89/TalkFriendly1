"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { SessionStatusResponse } from "@/types/session-tracking.types";
import { formatDuration, calculateCurrentDuration } from "@/lib/session-duration-utils";

interface SessionAttendanceControlsProps {
  appointmentId: string;
  isListener?: boolean;
  onStatusChange?: (status: SessionStatusResponse) => void;
}

export function SessionAttendanceControls({
  appointmentId,
  isListener = false,
  onStatusChange,
}: SessionAttendanceControlsProps) {
  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const { success, error: showError } = useToast();

  // Fetch session status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/sessions/status?appointment_id=${appointmentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch session status');
      }

      setStatus(data);
      onStatusChange?.(data);
    } catch (error: any) {
      console.error('Error fetching session status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check in
  const handleCheckIn = async () => {
    setActionInProgress(true);
    try {
      const response = await fetch('/api/sessions/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in');
      }

      success('Successfully checked in to session');
      await fetchStatus();
    } catch (error: any) {
      console.error('Error checking in:', error);
      showError(error.message || 'Failed to check in');
    } finally {
      setActionInProgress(false);
    }
  };

  // Check out
  const handleCheckOut = async () {
    setActionInProgress(true);
    try {
      const response = await fetch('/api/sessions/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check out');
      }

      success(`Checked out successfully. Duration: ${data.duration_minutes} minutes`);
      await fetchStatus();
    } catch (error: any) {
      console.error('Error checking out:', error);
      showError(error.message || 'Failed to check out');
    } finally {
      setActionInProgress(false);
    }
  };

  // Update current duration every minute
  useEffect(() => {
    if (!status) return;

    const mySession = isListener ? status.listener_session : status.user_session;
    if (!mySession) return;

    const updateDuration = () => {
      const duration = calculateCurrentDuration(mySession);
      setCurrentDuration(duration);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [status, isListener]);

  // Refresh status every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load session status</span>
        </div>
      </Card>
    );
  }

  const mySession = isListener ? status.listener_session : status.user_session;
  const otherCheckedIn = isListener ? status.user_checked_in : status.listener_checked_in;
  const imCheckedIn = !!mySession;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold">Session Attendance</h3>
          </div>

          {/* Status Badge */}
          <Badge
            variant={
              status.status === 'both_present' ? 'success' :
              status.status === 'not_started' ? 'secondary' :
              'warning'
            }
          >
            {status.status === 'both_present' && '● Both Present'}
            {status.status === 'listener_present' && '● Listener Present'}
            {status.status === 'user_present' && '● User Present'}
            {status.status === 'not_started' && '○ Not Started'}
            {status.status === 'completed' && '✓ Completed'}
          </Badge>
        </div>

        {/* Participants Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Listener Status */}
          <div className="flex items-center gap-2 text-sm">
            {status.listener_checked_in ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={status.listener_checked_in ? 'text-green-600 font-medium' : 'text-gray-500'}>
              Listener {status.listener_checked_in ? 'checked in' : 'not checked in'}
            </span>
          </div>

          {/* User Status */}
          <div className="flex items-center gap-2 text-sm">
            {status.user_checked_in ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className={status.user_checked_in ? 'text-green-600 font-medium' : 'text-gray-500'}>
              User {status.user_checked_in ? 'checked in' : 'not checked in'}
            </span>
          </div>
        </div>

        {/* Current Duration */}
        {imCheckedIn && mySession && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-200">
                You've been in session for:
              </span>
              <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                {formatDuration(currentDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Overlapping Duration (if completed) */}
        {status.status === 'completed' && status.overlapping_duration_minutes && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800 dark:text-green-200">
                Session duration (both present):
              </span>
              <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                {formatDuration(status.overlapping_duration_minutes)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2">
          {!imCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              disabled={actionInProgress}
              className="w-full"
              size="lg"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Check In to Session
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={actionInProgress}
              className="w-full"
              variant="destructive"
              size="lg"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking out...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  Check Out
                </>
              )}
            </Button>
          )}
        </div>

        {/* Helper Text */}
        {!otherCheckedIn && imCheckedIn && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            <Users className="h-4 w-4 inline mr-1" />
            Waiting for other participant to check in...
          </p>
        )}

        {status.status === 'completed' && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">
            ✓ Session completed. Both participants have checked out.
          </p>
        )}
      </div>
    </Card>
  );
}
