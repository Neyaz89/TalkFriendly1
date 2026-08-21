/**
 * Listener service.
 * Handles all listener-related API calls.
 */

import type { Listener, ListenerReview, ListenerFilterParams } from "@/types";
import { MOCK_LISTENERS, MOCK_LISTENER_REVIEWS } from "@/mocks/listeners.mock";
import { delay } from "@/lib/utils";

export const listenerService = {
  /**
   * GET /listeners
   * Returns a list of listeners with optional filtering.
   */
  async getListeners(params?: ListenerFilterParams): Promise<{ listeners: Listener[]; total: number }> {
    await delay(600);

    let listeners = [...MOCK_LISTENERS];

    if (params?.expertise?.length) {
      listeners = listeners.filter((l) =>
        params.expertise!.some((e) => l.expertise.includes(e))
      );
    }

    if (params?.language) {
      listeners = listeners.filter((l) =>
        l.languages.some((lang) => lang.toLowerCase() === params.language!.toLowerCase())
      );
    }

    if (params?.maxPrice) {
      listeners = listeners.filter((l) => l.pricing.perSession <= params.maxPrice! * 100);
    }

    if (params?.rating) {
      listeners = listeners.filter((l) => l.rating >= params.rating!);
    }

    return { listeners, total: listeners.length };
  },

  /**
   * GET /listeners/:id
   * Returns a single listener's full profile.
   */
  async getListenerById(id: string): Promise<Listener> {
    await delay(400);

    const listener = MOCK_LISTENERS.find((l) => l.id === id);
    if (!listener) throw new Error("Listener not found");

    return listener;
  },

  /**
   * GET /listeners/:id/reviews
   * Returns reviews for a specific listener.
   */
  async getListenerReviews(listenerId: string): Promise<ListenerReview[]> {
    await delay(400);
    return MOCK_LISTENER_REVIEWS.filter((r) => r.listenerId === listenerId);
  },

  /**
   * GET /listeners/recommended
   * Returns AI-recommended listeners based on user's profile.
   */
  async getRecommended(): Promise<Listener[]> {
    await delay(700);
    return MOCK_LISTENERS.filter((l) => l.isVerified).slice(0, 3);
  },
};
