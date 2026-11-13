/**
 * Session Duration Calculation Utilities
 * Handles overlapping time interval calculations for attendance tracking
 */

import type { ParticipantSession, SessionDuration, TimeInterval } from '@/types/session-tracking.types';

/**
 * Calculate overlapping duration between two time intervals
 * Returns duration in minutes
 */
export function calculateOverlap(interval1: TimeInterval, interval2: TimeInterval): number {
  const start1 = interval1.start.getTime();
  const end1 = interval1.end.getTime();
  const start2 = interval2.start.getTime();
  const end2 = interval2.end.getTime();

  // No overlap if intervals don't intersect
  if (end1 <= start2 || end2 <= start1) {
    return 0;
  }

  // Calculate overlap
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapMs = overlapEnd - overlapStart;

  return Math.max(0, Math.floor(overlapMs / 1000 / 60)); // Convert to minutes
}

/**
 * Calculate total duration of multiple intervals, accounting for overlaps
 * Returns duration in minutes
 */
export function calculateTotalDuration(sessions: ParticipantSession[]): number {
  if (sessions.length === 0) return 0;

  let totalMinutes = 0;

  for (const session of sessions) {
    if (session.left_at) {
      const joinedMs = new Date(session.joined_at).getTime();
      const leftMs = new Date(session.left_at).getTime();
      const durationMs = leftMs - joinedMs;
      totalMinutes += Math.floor(durationMs / 1000 / 60);
    }
  }

  return totalMinutes;
}

/**
 * Calculate overlapping duration between listener and user sessions
 * This represents the billable time when both were present
 */
export function calculateOverlappingDuration(
  listenerSessions: ParticipantSession[],
  userSessions: ParticipantSession[]
): number {
  let totalOverlapMinutes = 0;

  // Check each listener session against each user session
  for (const listenerSession of listenerSessions) {
    if (!listenerSession.left_at) continue; // Skip incomplete sessions

    const listenerInterval: TimeInterval = {
      start: new Date(listenerSession.joined_at),
      end: new Date(listenerSession.left_at),
    };

    for (const userSession of userSessions) {
      if (!userSession.left_at) continue; // Skip incomplete sessions

      const userInterval: TimeInterval = {
        start: new Date(userSession.joined_at),
        end: new Date(userSession.left_at),
      };

      const overlap = calculateOverlap(listenerInterval, userInterval);
      totalOverlapMinutes += overlap;
    }
  }

  return totalOverlapMinutes;
}

/**
 * Calculate comprehensive session duration metrics
 */
export function calculateSessionDuration(
  listenerSessions: ParticipantSession[],
  userSessions: ParticipantSession[]
): SessionDuration {
  const listenerTotal = calculateTotalDuration(listenerSessions);
  const userTotal = calculateTotalDuration(userSessions);
  const overlapping = calculateOverlappingDuration(listenerSessions, userSessions);

  return {
    listener_total_minutes: listenerTotal,
    user_total_minutes: userTotal,
    overlapping_minutes: overlapping,
    billable_minutes: overlapping, // Billable time = time both were present
  };
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format duration in minutes to hours with decimal
 */
export function formatDurationHours(minutes: number): string {
  const hours = (minutes / 60).toFixed(2);
  return `${hours} hrs`;
}

/**
 * Check if a session is currently active
 */
export function isSessionActive(session: ParticipantSession): boolean {
  return session.left_at === null;
}

/**
 * Check if both participants are currently checked in
 */
export function areBothParticipantsPresent(
  listenerSessions: ParticipantSession[],
  userSessions: ParticipantSession[]
): boolean {
  const listenerActive = listenerSessions.some(isSessionActive);
  const userActive = userSessions.some(isSessionActive);
  return listenerActive && userActive;
}

/**
 * Get the active session for a participant (if any)
 */
export function getActiveSession(sessions: ParticipantSession[]): ParticipantSession | null {
  return sessions.find(isSessionActive) || null;
}

/**
 * Calculate session duration in real-time (for active sessions)
 */
export function calculateCurrentDuration(session: ParticipantSession): number {
  const joinedMs = new Date(session.joined_at).getTime();
  const nowMs = Date.now();
  const durationMs = nowMs - joinedMs;
  return Math.floor(durationMs / 1000 / 60); // Minutes
}

/**
 * Validate session times (check-out must be after check-in)
 */
export function validateSessionTimes(joinedAt: Date, leftAt: Date): {
  isValid: boolean;
  error?: string;
} {
  if (leftAt <= joinedAt) {
    return {
      isValid: false,
      error: 'Check-out time must be after check-in time',
    };
  }

  const durationMinutes = (leftAt.getTime() - joinedAt.getTime()) / 1000 / 60;

  if (durationMinutes > 24 * 60) {
    return {
      isValid: false,
      error: 'Session duration cannot exceed 24 hours',
    };
  }

  return { isValid: true };
}

/**
 * Round duration to nearest billing increment (e.g., 15 minutes)
 */
export function roundToBillingIncrement(minutes: number, increment: number = 15): number {
  return Math.ceil(minutes / increment) * increment;
}

/**
 * Calculate overlapping percentage between two intervals
 */
export function calculateOverlapPercentage(
  interval1: TimeInterval,
  interval2: TimeInterval
): number {
  const duration1 = interval1.end.getTime() - interval1.start.getTime();
  const duration2 = interval2.end.getTime() - interval2.start.getTime();

  if (duration1 === 0 || duration2 === 0) return 0;

  const overlapMinutes = calculateOverlap(interval1, interval2);
  const overlapMs = overlapMinutes * 60 * 1000;
  const shorterDuration = Math.min(duration1, duration2);

  return (overlapMs / shorterDuration) * 100;
}

/**
 * Merge overlapping intervals (for deduplication)
 */
export function mergeOverlappingIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  // Sort by start time
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    // If current overlaps with last merged, extend the end time
    if (current.start.getTime() <= lastMerged.end.getTime()) {
      lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), current.end.getTime()));
    } else {
      // No overlap, add as new interval
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Check if session seems suspicious (too short or too long)
 */
export function checkSessionAnomalies(session: ParticipantSession): {
  hasSuspiciousActivity: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!session.left_at) {
    return { hasSuspiciousActivity: false, warnings: [] };
  }

  const durationMinutes = calculateTotalDuration([session]);

  // Too short
  if (durationMinutes < 5) {
    warnings.push('Session duration is unusually short (< 5 minutes)');
  }

  // Too long
  if (durationMinutes > 240) { // 4 hours
    warnings.push('Session duration is unusually long (> 4 hours)');
  }

  // Check-in in the future
  const joinedAt = new Date(session.joined_at);
  if (joinedAt > new Date()) {
    warnings.push('Check-in time is in the future');
  }

  return {
    hasSuspiciousActivity: warnings.length > 0,
    warnings,
  };
}
