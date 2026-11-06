/**
 * Timezone Utilities
 * 
 * Handles timezone conversions for appointment scheduling.
 * All appointments are stored in UTC in the database.
 * Display times are converted to user's local timezone.
 */

import { format, parseISO, addMinutes, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

// ============================================================================
// Timezone Detection
// ============================================================================

/**
 * Get user's browser timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert UTC timestamp to specific timezone
 */
export function utcToTimezone(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Convert local time in specific timezone to UTC
 */
export function timezoneToUtc(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}

/**
 * Format date in specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr);
}

// ============================================================================
// Appointment-Specific Functions
// ============================================================================

/**
 * Get appointment time display for user's timezone
 */
export function getAppointmentTimeDisplay(
  utcStartTime: string,
  durationMinutes: number,
  userTimezone: string
): {
  date: string; // "Monday, November 4, 2026"
  time: string; // "2:00 PM - 3:00 PM"
  timezone: string; // "EST"
  fullDateTime: string; // "Monday, November 4, 2026 at 2:00 PM EST"
} {
  const startDate = parseISO(utcStartTime);
  const endDate = addMinutes(startDate, durationMinutes);

  const date = formatInTimezone(startDate, userTimezone, 'EEEE, MMMM d, yyyy');
  const startTime = formatInTimezone(startDate, userTimezone, 'h:mm a');
  const endTime = formatInTimezone(endDate, userTimezone, 'h:mm a');
  const tz = formatInTimezone(startDate, userTimezone, 'zzz');

  return {
    date,
    time: `${startTime} - ${endTime}`,
    timezone: tz,
    fullDateTime: `${date} at ${startTime} ${tz}`,
  };
}

/**
 * Create UTC timestamp from date and time in specific timezone
 */
export function createAppointmentTimestamp(
  date: string, // YYYY-MM-DD
  time: string, // HH:MM
  timezone: string
): string {
  const localDateTime = new Date(`${date}T${time}:00`);
  const utcDate = timezoneToUtc(localDateTime, timezone);
  return utcDate.toISOString();
}

/**
 * Get available time slots for a date in user's timezone
 */
export function generateTimeSlots(
  date: string, // YYYY-MM-DD
  startTime: string, // HH:MM (in timezone)
  endTime: string, // HH:MM (in timezone)
  intervalMinutes: number,
  timezone: string
): Array<{ value: string; label: string; utcTimestamp: string }> {
  const slots: Array<{ value: string; label: string; utcTimestamp: string }> = [];

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    const utcTimestamp = createAppointmentTimestamp(date, timeStr, timezone);
    
    slots.push({
      value: timeStr,
      label: format(new Date(`2000-01-01T${timeStr}`), 'h:mm a'),
      utcTimestamp,
    });

    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if appointment time is in the future
 */
export function isAppointmentInFuture(
  utcStartTime: string,
  minimumMinutesFromNow: number = 0
): boolean {
  const appointmentTime = parseISO(utcStartTime);
  const now = new Date();
  const minimumTime = addMinutes(now, minimumMinutesFromNow);
  
  return isAfter(appointmentTime, minimumTime);
}

/**
 * Check if appointment is within join window
 */
export function isWithinJoinWindow(
  utcStartTime: string,
  joinWindowMinutes: number = 15
): boolean {
  const appointmentTime = parseISO(utcStartTime);
  const now = new Date();
  const windowStart = addMinutes(appointmentTime, -joinWindowMinutes);
  
  return isAfter(now, windowStart) && isBefore(now, appointmentTime);
}

/**
 * Check if appointment has started
 */
export function hasAppointmentStarted(utcStartTime: string): boolean {
  const appointmentTime = parseISO(utcStartTime);
  const now = new Date();
  return isAfter(now, appointmentTime);
}

/**
 * Get minutes until appointment starts
 */
export function getMinutesUntilAppointment(utcStartTime: string): number {
  const appointmentTime = parseISO(utcStartTime);
  const now = new Date();
  return differenceInMinutes(appointmentTime, now);
}

/**
 * Get minutes since appointment started
 */
export function getMinutesSinceAppointmentStart(utcStartTime: string): number {
  const appointmentTime = parseISO(utcStartTime);
  const now = new Date();
  return differenceInMinutes(now, appointmentTime);
}

/**
 * Check if appointment has ended
 */
export function hasAppointmentEnded(
  utcStartTime: string,
  durationMinutes: number
): boolean {
  const appointmentTime = parseISO(utcStartTime);
  const endTime = addMinutes(appointmentTime, durationMinutes);
  const now = new Date();
  return isAfter(now, endTime);
}

// ============================================================================
// Business Hours Utilities
// ============================================================================

/**
 * Convert business hours from one timezone to another
 */
export function convertBusinessHours(
  dayOfWeek: number,
  startTime: string, // HH:MM
  endTime: string, // HH:MM
  fromTimezone: string,
  toTimezone: string
): Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}> {
  // Create a reference date (use a known Monday)
  const referenceDate = new Date('2024-01-01'); // This is a Monday
  const targetDate = addMinutes(referenceDate, dayOfWeek * 24 * 60);

  // Create start and end times in source timezone
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startDateTime = new Date(targetDate);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(targetDate);
  endDateTime.setHours(endHour, endMin, 0, 0);

  // Convert to target timezone
  const startInTarget = utcToTimezone(
    timezoneToUtc(startDateTime, fromTimezone),
    toTimezone
  );
  const endInTarget = utcToTimezone(
    timezoneToUtc(endDateTime, fromTimezone),
    toTimezone
  );

  // Check if times span multiple days
  const results: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }> = [];

  const startDay = startInTarget.getDay();
  const endDay = endInTarget.getDay();

  if (startDay === endDay) {
    // Same day
    results.push({
      dayOfWeek: startDay,
      startTime: format(startInTarget, 'HH:mm'),
      endTime: format(endInTarget, 'HH:mm'),
    });
  } else {
    // Spans multiple days
    results.push({
      dayOfWeek: startDay,
      startTime: format(startInTarget, 'HH:mm'),
      endTime: '23:59',
    });
    results.push({
      dayOfWeek: endDay,
      startTime: '00:00',
      endTime: format(endInTarget, 'HH:mm'),
    });
  }

  return results;
}

/**
 * Check if current time is within business hours
 */
export function isWithinBusinessHours(
  businessHours: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>,
  timezone: string
): boolean {
  const now = utcToTimezone(new Date(), timezone);
  const currentDay = now.getDay();
  const currentTime = format(now, 'HH:mm');

  const todayHours = businessHours.filter((h) => h.dayOfWeek === currentDay);

  for (const hours of todayHours) {
    if (currentTime >= hours.startTime && currentTime <= hours.endTime) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Display Formatting
// ============================================================================

/**
 * Get relative time description
 */
export function getRelativeTimeDescription(utcStartTime: string): string {
  const minutesUntil = getMinutesUntilAppointment(utcStartTime);

  if (minutesUntil < 0) {
    const minutesSince = Math.abs(minutesUntil);
    if (minutesSince < 60) {
      return `Started ${minutesSince} minute${minutesSince !== 1 ? 's' : ''} ago`;
    }
    const hoursSince = Math.floor(minutesSince / 60);
    return `Started ${hoursSince} hour${hoursSince !== 1 ? 's' : ''} ago`;
  }

  if (minutesUntil === 0) {
    return 'Starting now';
  }

  if (minutesUntil < 60) {
    return `In ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
  }

  if (minutesUntil < 1440) {
    // Less than 24 hours
    const hours = Math.floor(minutesUntil / 60);
    return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(minutesUntil / 1440);
  return `In ${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Format appointment countdown
 */
export function formatAppointmentCountdown(utcStartTime: string): string {
  const minutesUntil = getMinutesUntilAppointment(utcStartTime);

  if (minutesUntil <= 0) {
    return 'Now';
  }

  if (minutesUntil < 60) {
    return `${minutesUntil}m`;
  }

  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ============================================================================
// Common Timezones
// ============================================================================

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'UTC', label: 'UTC' },
] as const;
