/**
 * Doctor service.
 * Handles doctor profiles, discovery, and reviews.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  DoctorProfile,
  DoctorWithProfile,
  DoctorReview,
  DoctorReviewWithReviewer,
  CreateDoctorProfilePayload,
  UpdateDoctorProfilePayload,
  CreateDoctorReviewPayload,
  DoctorFilterParams,
} from '@/types';

export const doctorService = {
  /**
   * Get all verified doctors with optional filtering
   */
  async getDoctors(params?: DoctorFilterParams): Promise<{ doctors: DoctorWithProfile[]; total: number }> {
    const supabase = createClient();

    let query = supabase
      .from('listeners')
      .select(`
        *,
        profile:profiles!user_id(
          id, username, full_name, email, avatar_url, bio, 
          account_type, location, is_verified
        )
      `, { count: 'exact' })
      .eq('is_doctor', true)
      .eq('verification_status', 'verified');

    // Apply filters
    if (params?.specialization?.length) {
      query = query.contains('specialization', params.specialization);
    }

    if (params?.languages?.length) {
      query = query.contains('languages', params.languages);
    }

    if (params?.min_rating) {
      query = query.gte('rating', params.min_rating);
    }

    if (params?.max_fee) {
      query = query.lte('consultation_fee', params.max_fee);
    }

    if (params?.accepts_patients !== undefined) {
      query = query.eq('accepts_new_patients', params.accepts_patients);
    }

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,bio.ilike.%${params.search}%`);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('rating', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      doctors: (data || []) as DoctorWithProfile[],
      total: count || 0,
    };
  },

  /**
   * Get a single doctor by ID
   */
  async getDoctorById(id: string): Promise<DoctorWithProfile> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('listeners')
      .select(`
        *,
        profile:profiles!user_id(
          id, username, full_name, email, avatar_url, bio, 
          account_type, location, is_verified
        )
      `)
      .eq('id', id)
      .eq('is_doctor', true)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Doctor not found');

    return data as DoctorWithProfile;
  },

  /**
   * Get reviews for a specific doctor
   */
  async getDoctorReviews(doctorId: string): Promise<DoctorReviewWithReviewer[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('doctor_reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(
          id, username, full_name, avatar_url
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as DoctorReviewWithReviewer[];
  },

  /**
   * Create a doctor profile (for existing user)
   */
  async createDoctorProfile(payload: CreateDoctorProfilePayload): Promise<DoctorProfile> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update profile account type
    await supabase
      .from('profiles')
      .update({ account_type: 'doctor' })
      .eq('id', user.id);

    // Create doctor/listener record
    const { data, error } = await supabase
      .from('listeners')
      .insert({
        user_id: user.id,
        name: payload.name,
        professional_title: payload.professional_title,
        qualifications: payload.qualifications,
        specialization: payload.specialization,
        bio: payload.bio,
        years_of_experience: payload.years_of_experience,
        education: payload.education,
        languages: payload.languages,
        consultation_fee: payload.consultation_fee,
        license_number: payload.license_number,
        specialties: payload.specialties,
        is_doctor: true,
        verification_status: 'pending',
        accepts_new_patients: false, // Until verified
        allow_messages: false, // Until verified
      })
      .select()
      .single();

    if (error) throw error;

    return data as DoctorProfile;
  },

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(
    doctorId: string,
    payload: UpdateDoctorProfilePayload
  ): Promise<DoctorProfile> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('listeners')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doctorId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return data as DoctorProfile;
  },

  /**
   * Create a review for a doctor
   */
  async createReview(payload: CreateDoctorReviewPayload): Promise<DoctorReview> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user already reviewed this doctor
    const { data: existing } = await supabase
      .from('doctor_reviews')
      .select('id')
      .eq('doctor_id', payload.doctor_id)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    if (existing) {
      throw new Error('You have already reviewed this doctor');
    }

    const { data, error } = await supabase
      .from('doctor_reviews')
      .insert({
        doctor_id: payload.doctor_id,
        reviewer_id: user.id,
        rating: payload.rating,
        comment: payload.comment,
        booking_id: payload.booking_id,
        is_verified_booking: !!payload.booking_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for doctor
    const { data: doctor } = await supabase
      .from('listeners')
      .select('user_id')
      .eq('id', payload.doctor_id)
      .single();

    if (doctor) {
      await supabase.from('notifications').insert({
        user_id: doctor.user_id,
        notification_type: 'review',
        title: 'New Review',
        message: `You received a ${payload.rating}-star review`,
        data: { review_id: data.id, rating: payload.rating },
        link: `/profile`,
      });
    }

    return data;
  },

  /**
   * Update a review
   */
  async updateReview(reviewId: string, rating: number, comment?: string): Promise<DoctorReview> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('doctor_reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('doctor_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', user.id);

    if (error) throw error;
  },

  /**
   * Get recommended doctors based on user's needs
   */
  async getRecommendedDoctors(limit: number = 5): Promise<DoctorWithProfile[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('listeners')
      .select(`
        *,
        profile:profiles!user_id(
          id, username, full_name, email, avatar_url, bio, 
          account_type, location, is_verified
        )
      `)
      .eq('is_doctor', true)
      .eq('verification_status', 'verified')
      .eq('accepts_new_patients', true)
      .gte('rating', 4.0)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as DoctorWithProfile[];
  },

  /**
   * Check if user can message a doctor
   */
  async canMessageDoctor(doctorId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('listeners')
      .select('allow_messages')
      .eq('id', doctorId)
      .eq('is_doctor', true)
      .single();

    if (error) return false;

    return data?.allow_messages || false;
  },
};
