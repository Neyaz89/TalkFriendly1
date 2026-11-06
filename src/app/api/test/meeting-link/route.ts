/**
 * Test Video Meeting Creation
 * GET /api/test/meeting-link
 * 
 * Tests Jitsi Meet integration (always works - no API key needed!)
 */

import { NextResponse } from 'next/server';
import { videoService } from '@/services/google-meet.service';

export async function GET() {
  try {
    console.log('🧪 Testing Jitsi Meet video integration...');
    
    // Create a test meeting
    const testAppointmentId = `test_${Date.now()}`;
    const meetingDetails = await videoService.createMeeting(testAppointmentId);

    return NextResponse.json({
      success: true,
      test_passed: true,
      meeting_uri: meetingDetails.meeting_uri,
      meeting_code: meetingDetails.meeting_code,
      space_name: meetingDetails.space_name,
      platform: 'jitsi',
      message: '✅ Jitsi Meet room created successfully!',
      features: [
        '✅ 100% free forever',
        '✅ No credit card required',
        '✅ No API key needed',
        '✅ HD video quality',
        '✅ Screen sharing',
        '✅ Recording',
        '✅ Unlimited participants',
        '✅ Unlimited duration',
      ],
      next_steps: [
        '✅ Everything is ready!',
        '✅ Just book a session and click the link',
        '✅ No setup required',
      ],
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        test_passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
