/**
 * Listener Verification Utilities
 * Helper functions for checking listener verification status
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export type VerificationStatus = 'draft' | 'pending_review' | 'additional_info_required' | 'approved' | 'rejected' | 'verified' | 'unverified';

export interface VerificationCheckResult {
  isVerified: boolean;
  status: VerificationStatus;
  canAcceptBookings: boolean;
  message?: string;
}

/**
 * Check if a listener is verified and can accept bookings (client-side)
 */
export async function checkListenerVerification(userId: string): Promise<VerificationCheckResult> {
  const supabase = createClient();

  const { data: listener, error } = await supabase
    .from('listeners')
    .select('verification_status')
    .eq('user_id', userId)
    .single();

  if (error || !listener) {
    return {
      isVerified: false,
      status: 'unverified',
      canAcceptBookings: false,
      message: 'Listener profile not found',
    };
  }

  const status = listener.verification_status as VerificationStatus;
  const isVerified = status === 'verified';
  const canAcceptBookings = isVerified;

  return {
    isVerified,
    status,
    canAcceptBookings,
    message: getStatusMessage(status),
  };
}

/**
 * Check if a listener is verified and can accept bookings (server-side)
 */
export async function checkListenerVerificationServer(userId: string): Promise<VerificationCheckResult> {
  const supabase = await createServerClient();

  const { data: listener, error } = await supabase
    .from('listeners')
    .select('verification_status')
    .eq('user_id', userId)
    .single();

  if (error || !listener) {
    return {
      isVerified: false,
      status: 'unverified',
      canAcceptBookings: false,
      message: 'Listener profile not found',
    };
  }

  const status = listener.verification_status as VerificationStatus;
  const isVerified = status === 'verified';
  const canAcceptBookings = isVerified;

  return {
    isVerified,
    status,
    canAcceptBookings,
    message: getStatusMessage(status),
  };
}

/**
 * Get user-friendly message for verification status
 */
function getStatusMessage(status: VerificationStatus): string {
  const messages: Record<VerificationStatus, string> = {
    draft: 'Your application is in draft. Please complete and submit it for review.',
    pending_review: 'Your application is under review. This typically takes 2-5 business days.',
    additional_info_required: 'Additional information is required. Please check your application status page.',
    approved: 'Your application has been approved! You can now accept bookings.',
    rejected: 'Your application was not approved. Please check feedback for details.',
    verified: 'You are verified and can accept bookings.',
    unverified: 'You need to complete the listener application process.',
  };

  return messages[status] || 'Unknown status';
}

/**
 * Get listener application status
 */
export async function getListenerApplicationStatus(userId: string) {
  const supabase = createClient();

  const { data: application, error } = await supabase
    .from('listener_applications')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !application) {
    return null;
  }

  return application;
}
