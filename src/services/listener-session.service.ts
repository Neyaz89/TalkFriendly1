/**
 * Listener session service with server-side limit enforcement
 */

import axios from 'axios';

export interface SessionAvailability {
  canBook: boolean;
  tier: 'free' | 'plus' | 'premium';
  sessionsUsed: number;
  sessionsRemaining: number | 'unlimited';
  sessionsLimit?: number;
  resetDate: string | null;
}

export interface BookingData {
  listenerId: string;
  sessionDate: string;
  sessionDuration: number;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  booking: {
    id: string;
    user_id: string;
    listener_id: string;
    session_date: string;
    session_duration: number;
    status: string;
    notes?: string;
    created_at: string;
  };
  sessionsUsed: number;
  tier: string;
}

export const listenerSessionService = {
  /**
   * Check if user can book a listener session
   */
  async checkAvailability(): Promise<SessionAvailability> {
    try {
      const response = await axios.post('/api/listeners/check-availability');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Failed to check availability');
      }
      throw error;
    }
  },

  /**
   * Book a listener session
   */
  async bookSession(bookingData: BookingData): Promise<BookingResponse> {
    try {
      const response = await axios.post('/api/listeners/book', bookingData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        throw new Error(errorData.message || errorData.error || 'Failed to book session');
      }
      throw error;
    }
  },
};
