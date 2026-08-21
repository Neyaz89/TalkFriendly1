/**
 * Booking service.
 * Handles session booking with listeners.
 */

import type { Booking, CreateBookingPayload, BookingSlot } from "@/types";
import { delay, generateId } from "@/lib/utils";
import { MOCK_LISTENERS } from "@/mocks/listeners.mock";

const MOCK_BOOKINGS: Booking[] = [];

export const bookingService = {
  /**
   * GET /bookings
   * Returns user's upcoming and past bookings.
   */
  async getBookings(): Promise<Booking[]> {
    await delay(500);
    return MOCK_BOOKINGS;
  },

  /**
   * POST /booking
   * Creates a new session booking.
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    await delay(1000);

    const listener = MOCK_LISTENERS.find((l) => l.id === payload.listenerId);
    if (!listener) throw new Error("Listener not found");

    const endTime = calculateEndTime(payload.startTime, payload.duration);

    const booking: Booking = {
      id: `booking_${generateId()}`,
      userId: "user_001",
      listenerId: payload.listenerId,
      listenerName: listener.name,
      listenerAvatar: listener.avatar,
      date: payload.date,
      startTime: payload.startTime,
      endTime,
      duration: payload.duration,
      sessionType: payload.sessionType,
      status: "confirmed",
      price: getPriceForDuration(listener.pricing.perSession, payload.duration),
      currency: "USD",
      notes: payload.notes,
      meetingUrl: `https://meet.talkfriendly.app/${generateId()}`,
      createdAt: new Date().toISOString(),
    };

    MOCK_BOOKINGS.push(booking);
    return booking;
  },

  /**
   * GET /listeners/:id/slots
   * Returns available booking slots for a listener.
   */
  async getAvailableSlots(): Promise<BookingSlot[]> {
    await delay(400);

    const allSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

    // Randomly mark some as unavailable for realism
    return allSlots.map((time) => ({
      time,
      isAvailable: Math.random() > 0.3,
    }));
  },

  /**
   * DELETE /bookings/:id
   * Cancels a booking.
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await delay(600);
    const index = MOCK_BOOKINGS.findIndex((b) => b.id === bookingId);
    if (index !== -1) {
      MOCK_BOOKINGS[index].status = "cancelled";
    }
  },
};

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

function getPriceForDuration(basePrice: number, duration: number): number {
  // Base price is for 60 min; scale proportionally
  return Math.round((basePrice * duration) / 60);
}
