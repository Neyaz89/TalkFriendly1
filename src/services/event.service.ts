/**
 * Events and Listening Circles service.
 */

import type { ListeningCircle, AppEvent } from "@/types";
import { MOCK_CIRCLES, MOCK_EVENTS } from "@/mocks/events.mock";
import { delay } from "@/lib/utils";

const mockCircles = [...MOCK_CIRCLES];
const mockEvents = [...MOCK_EVENTS];

export const eventService = {
  /**
   * GET /circles
   * Returns upcoming listening circles.
   */
  async getCircles(): Promise<ListeningCircle[]> {
    await delay(500);
    return mockCircles;
  },

  /**
   * POST /circles/:id/join
   * Joins a listening circle.
   */
  async joinCircle(circleId: string): Promise<ListeningCircle> {
    await delay(500);

    const index = mockCircles.findIndex((c) => c.id === circleId);
    if (index === -1) throw new Error("Circle not found");

    mockCircles[index] = {
      ...mockCircles[index],
      isJoined: true,
      currentParticipants: mockCircles[index].currentParticipants + 1,
    };

    return mockCircles[index];
  },

  /**
   * POST /circles/:id/reminder
   * Sets or removes a reminder for a circle.
   */
  async toggleReminder(circleId: string): Promise<ListeningCircle> {
    await delay(300);

    const index = mockCircles.findIndex((c) => c.id === circleId);
    if (index === -1) throw new Error("Circle not found");

    mockCircles[index] = {
      ...mockCircles[index],
      hasReminder: !mockCircles[index].hasReminder,
    };

    return mockCircles[index];
  },

  /**
   * GET /events
   * Returns upcoming events.
   */
  async getEvents(): Promise<AppEvent[]> {
    await delay(500);
    return mockEvents;
  },

  /**
   * POST /events/:id/join
   * Joins an event.
   */
  async joinEvent(eventId: string): Promise<AppEvent> {
    await delay(500);

    const index = mockEvents.findIndex((e) => e.id === eventId);
    if (index === -1) throw new Error("Event not found");

    mockEvents[index] = {
      ...mockEvents[index],
      isJoined: true,
      currentAttendees: mockEvents[index].currentAttendees + 1,
    };

    return mockEvents[index];
  },
};
