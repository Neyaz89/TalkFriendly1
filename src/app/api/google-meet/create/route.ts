/**
 * Create Video Meeting API
 * POST /api/google-meet/create
 * 
 * Creates video conferencing rooms for appointments.
 * Now using Jitsi Meet - 100% free, no credit card required!
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoService } from '@/services/google-meet.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      );
    }

    // Create video meeting room
    const meetingDetails = await videoService.createMeeting(appointmentId);

    return NextResponse.json({
      success: true,
      meeting_uri: meetingDetails.meeting_uri,
      meeting_code: meetingDetails.meeting_code,
      space_name: meetingDetails.space_name,
      platform: 'jitsi',
    });
  } catch (error) {
    console.error('Error creating video meeting:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create video meeting',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
