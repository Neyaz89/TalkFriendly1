/**
 * Listener service.
 * Handles all listener-related API calls.
 * 
 * IMPORTANT: This service now fetches REAL listeners from the database.
 * Only verified and approved listeners are returned.
 */

import { createClient } from '@/lib/supabase/client';
import type { Listener, ListenerReview, ListenerFilterParams } from "@/types";

export const listenerService = {
  /**
   * GET /listeners
   * Returns a list of verified listeners with optional filtering.
   * 
   * ONLY REAL, APPROVED LISTENERS ARE RETURNED.
   */
  async getListeners(
    params?: ListenerFilterParams
  ): Promise<{ listeners: Listener[]; total: number }> {
    const supabase = createClient();

    try {
      // Build query for verified listeners only
      let query = supabase
        .from('listeners')
        .select('*', { count: 'exact' })
        .eq('verification_status', 'verified')
        .eq('accepts_new_patients', true)
        .eq('is_available', true); // Only show listeners who are currently available

      // Filter by expertise/specialization
      if (params?.expertise && params.expertise.length > 0) {
        query = query.overlaps('specialization', params.expertise);
      }

      // Filter by language
      if (params?.language) {
        query = query.contains('languages', [params.language]);
      }

      // Filter by consultation fee
      if (params?.maxPrice) {
        const maxPriceCents = params.maxPrice * 100;
        query = query.lte('consultation_fee', maxPriceCents);
      }

      // Filter by minimum rating
      if (params?.rating) {
        query = query.gte('rating', params.rating);
      }

      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .range(from, to)
        .order('rating', { ascending: false })
        .order('reviews_count', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching listeners:', error);
        throw new Error(`Failed to fetch listeners: ${error.message}`);
      }

      // Transform database records to match Listener type
      const listeners = (data || []).map(transformListenerFromDB);

      return { 
        listeners, 
        total: count || 0 
      };
    } catch (error) {
      console.error('Listener service error:', error);
      throw error;
    }
  },

  /**
   * GET /listeners/:id
   * Returns a single verified listener's full profile.
   */
  async getListenerById(
    id: string
  ): Promise<Listener> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('listeners')
        .select('*')
        .eq('id', id)
        .eq('verification_status', 'verified')
        .single();

      if (error || !data) {
        throw new Error('Listener not found or not verified');
      }

      return transformListenerFromDB(data);
    } catch (error) {
      console.error('Error fetching listener:', error);
      throw error;
    }
  },

  /**
   * GET /listeners/:id/reviews
   * Returns reviews for a specific listener.
   * 
   * NOTE: This will be implemented in Phase 7 (Feedback and Ratings)
   */
  async getListenerReviews(listenerId: string): Promise<ListenerReview[]> {
    // TODO: Implement in Phase 7 - Feedback and Ratings
    // For now, return empty array
    return [];
  },

  /**
   * GET /listeners/recommended
   * Returns top-rated verified listeners.
   */
  async getRecommended(
    limit: number = 3
  ): Promise<Listener[]> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('listeners')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('accepts_new_patients', true)
        .eq('is_available', true) // Only recommend available listeners
        .order('rating', { ascending: false })
        .order('reviews_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recommended listeners:', error);
        throw new Error(`Failed to fetch recommended listeners: ${error.message}`);
      }

      return (data || []).map(transformListenerFromDB);
    } catch (error) {
      console.error('Error in getRecommended:', error);
      // Return empty array instead of throwing to prevent UI breaks
      return [];
    }
  },

  /**
   * Search listeners by name or specialization
   */
  async searchListeners(
    query: string
  ): Promise<Listener[]> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('listeners')
        .select('*')
        .eq('verification_status', 'verified')
        .eq('accepts_new_patients', true)
        .eq('is_available', true) // Only show available listeners in search
        .or(`name.ilike.%${query}%,professional_title.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error searching listeners:', error);
        return [];
      }

      return (data || []).map(transformListenerFromDB);
    } catch (error) {
      console.error('Error in searchListeners:', error);
      return [];
    }
  },
};

/**
 * Transform database listener record to Listener type
 * Maps database schema to frontend type structure
 */
function transformListenerFromDB(dbListener: any): Listener {
  return {
    id: dbListener.id,
    name: dbListener.name,
    avatar: dbListener.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbListener.name}`,
    bio: dbListener.bio || '',
    title: dbListener.professional_title || 'Mental Health Professional',
    expertise: dbListener.specialization || [],
    languages: dbListener.languages || ['English'],
    rating: dbListener.rating || 0,
    reviewCount: dbListener.reviews_count || 0,
    sessionCount: 0, // TODO: Calculate from appointments table
    responseTime: 'Usually within 1 hour', // Default value
    pricing: {
      perSession: dbListener.consultation_fee || 5000,
      currency: 'USD',
      sessionDurations: [15, 30, 60],
      trialAvailable: false,
    },
    availability: dbListener.availability || {
      timezone: 'America/New_York',
      slots: [],
      nextAvailable: null,
    },
    isVerified: dbListener.verification_status === 'verified',
    isOnline: dbListener.is_available || false, // Real-time availability status
    badges: buildBadges(dbListener),
    location: '', // Not stored in current schema
    experience: dbListener.years_of_experience || 0,
    education: dbListener.education || '',
    joinedAt: dbListener.created_at,
  };
}

/**
 * Build badges based on listener attributes
 */
function buildBadges(dbListener: any): string[] {
  const badges: string[] = [];

  if (dbListener.verification_status === 'verified') {
    badges.push('Verified');
  }

  if (dbListener.rating >= 4.8) {
    badges.push('Top Rated');
  }

  if (dbListener.reviews_count > 50) {
    badges.push('Trusted');
  }

  if (dbListener.years_of_experience >= 10) {
    badges.push('Experienced');
  }

  return badges;
}
