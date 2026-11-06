/**
 * Doctor profile and verification related TypeScript types.
 */

import type { Database } from './database.types';

export type DoctorProfile = Database['public']['Tables']['listeners']['Row'] & {
  is_doctor: true;
};

export type DoctorReview = Database['public']['Tables']['doctor_reviews']['Row'];
export type DoctorReviewInsert = Database['public']['Tables']['doctor_reviews']['Insert'];
export type DoctorReviewUpdate = Database['public']['Tables']['doctor_reviews']['Update'];

export interface DoctorWithProfile extends DoctorProfile {
  profile?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    account_type: string;
    location: string | null;
    is_verified: boolean;
  };
}

export interface DoctorReviewWithReviewer extends DoctorReview {
  reviewer?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateDoctorProfilePayload {
  name: string;
  professional_title: string;
  qualifications: string[];
  specialization: string[];
  bio?: string;
  years_of_experience?: number;
  education?: string;
  languages?: string[];
  consultation_fee?: number;
  license_number?: string;
  specialties: string[];
}

export interface UpdateDoctorProfilePayload {
  name?: string;
  professional_title?: string;
  qualifications?: string[];
  specialization?: string[];
  bio?: string;
  years_of_experience?: number;
  education?: string;
  languages?: string[];
  consultation_fee?: number;
  license_number?: string;
  accepts_new_patients?: boolean;
  allow_messages?: boolean;
  specialties?: string[];
  availability?: any;
}

export interface CreateDoctorReviewPayload {
  doctor_id: string;
  rating: number;
  comment?: string;
  booking_id?: string;
}

export interface DoctorFilterParams {
  specialization?: string[];
  languages?: string[];
  min_rating?: number;
  max_fee?: number;
  accepts_patients?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface DoctorVerificationPayload {
  status: VerificationStatus;
  notes?: string;
}
