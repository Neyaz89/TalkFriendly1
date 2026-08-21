/**
 * Session booking related TypeScript types.
 */

export interface Booking {
  id: string;
  userId: string;
  listenerId: string;
  listenerName: string;
  listenerAvatar?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  sessionType: "audio" | "video";
  status: BookingStatus;
  price: number; // in USD cents
  currency: string;
  notes?: string;
  meetingUrl?: string;
  createdAt: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface CreateBookingPayload {
  listenerId: string;
  date: string;
  startTime: string;
  duration: number;
  sessionType: "audio" | "video";
  notes?: string;
}

export interface BookingSlot {
  time: string;
  isAvailable: boolean;
}

export interface BookingStep {
  step: 1 | 2 | 3 | 4;
  label: string;
}
