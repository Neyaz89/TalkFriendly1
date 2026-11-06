/**
 * Psychiatrist Availability API Routes
 * 
 * GET /api/psychiatrists/[id]/availability - Get available slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment.service';
import type { SessionDuration } from '@/types';

// GET /api/psychiatrists/[id]/availability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30') as SessionDuration;
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const slots = await appointmentService.getAvailableSlots(
      params.id,
      date,
      duration,
      timezone,
      true
    );

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
