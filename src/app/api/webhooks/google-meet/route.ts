/**
 * Google Meet Webhook Handler
 * 
 * POST /api/webhooks/google-meet - Receive Google Meet events
 */

import { NextRequest, NextResponse } from 'next/server';
import { attendanceService } from '@/services/attendance.service';
import { googleMeetService } from '@/services/google-meet.service';
import type { GoogleMeetWebhookEvent } from '@/types';

// POST /api/webhooks/google-meet
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-goog-signature') || '';

    // Verify webhook signature
    const isValid = googleMeetService.verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the event
    const event: GoogleMeetWebhookEvent = JSON.parse(body);

    // Process the event
    const result = await attendanceService.processWebhookEvent(event, true);

    if (!result.success) {
      console.error('Webhook processing failed:', result.errors);
      
      // Return 200 to acknowledge receipt but log errors
      // Prevents Google from retrying endlessly
      return NextResponse.json({
        received: true,
        processed: false,
        errors: result.errors,
      });
    }

    return NextResponse.json({
      received: true,
      processed: true,
      action_taken: result.action_taken,
      appointment_id: result.appointment_id,
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Return 200 to acknowledge receipt even on error
    // This prevents Google from retrying on our internal errors
    return NextResponse.json({
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Internal error',
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-goog-signature',
    },
  });
}
