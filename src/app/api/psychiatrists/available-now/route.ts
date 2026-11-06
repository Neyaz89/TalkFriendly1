/**
 * Available Psychiatrists API Route
 * 
 * GET /api/psychiatrists/available-now - List immediately available psychiatrists
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentService } from '@/services/appointment.service';

// GET /api/psychiatrists/available-now
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const specialization = searchParams.get('specialization')?.split(',');
    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all psychiatrists (listeners with doctor role and verified status)
    let query = supabase
      .from('listeners')
      .select('*, user:profiles!user_id(*)')
      .eq('verification_status', 'verified') // Only verified listeners
      .gte('rating', minRating)
      .limit(limit);

    if (specialization && specialization.length > 0) {
      query = query.overlaps('specialties', specialization);
    }

    const { data: psychiatrists, error } = await query;

    if (error) {
      throw error;
    }

    // Check availability for each
    const availabilityChecks = await Promise.all(
      (psychiatrists || []).map(async (psychiatrist) => {
        const isAvailable = await appointmentService.checkPsychiatristAvailableNow(
          psychiatrist.user_id,
          true
        );

        return {
          id: psychiatrist.id,
          user_id: psychiatrist.user_id,
          name: psychiatrist.name,
          professional_title: null,
          specialization: psychiatrist.specialties,
          rating: psychiatrist.rating,
          avatar_url: psychiatrist.avatar_url,
          consultation_fee: 30.0, // From pricing config
          is_available_now: isAvailable,
        };
      })
    );

    // Filter to only available
    const available = availabilityChecks.filter((p) => p.is_available_now);

    return NextResponse.json({
      psychiatrists: available,
      total: available.length,
    });
  } catch (error) {
    console.error('Error fetching available psychiatrists:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch psychiatrists' },
      { status: 500 }
    );
  }
}
