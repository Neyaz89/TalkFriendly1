/**
 * Psychiatrist Availability Management API Routes
 * 
 * POST /api/psychiatrists/availability - Set availability
 * GET  /api/psychiatrists/availability - Get own availability schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment.service';
import { createClient } from '@/lib/supabase/server';
import type { SetAvailabilityPayload } from '@/types';

// POST /api/psychiatrists/availability - Set availability
export async function POST(request: NextRequest) {
  try {
    const body: SetAvailabilityPayload = await request.json();

    const availability = await appointmentService.setAvailability(body, true);

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error('Error setting availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set availability' },
      { status: 500 }
    );
  }
}

// GET /api/psychiatrists/availability - Get own schedule
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const schedule = await appointmentService.getAvailabilitySchedule(
      user.id,
      true
    );

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching availability schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
