/**
 * Appointments API Routes
 * 
 * POST   /api/appointments - Create new appointment
 * GET    /api/appointments - List user's appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment.service';
import { createClient } from '@/lib/supabase/server';
import type {
  CreateImmediateAppointmentPayload,
  CreateScheduledAppointmentPayload,
  AppointmentFilterParams,
} from '@/types';

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_type, ...payload } = body;
    
    const psychiatrist_id = payload.psychiatrist_id || payload.listener_id;

    if (!psychiatrist_id) {
      return NextResponse.json(
        { error: 'Psychiatrist/Listener ID is required' },
        { status: 400 }
      );
    }

    // Check if listener is verified
    const supabase = await createClient();
    const { data: listener, error: listenerError } = await supabase
      .from('listeners')
      .select('verification_status, user_id')
      .eq('user_id', psychiatrist_id)
      .single();

    if (listenerError || !listener) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      );
    }

    // Block appointments with non-verified listeners
    if (listener.verification_status !== 'verified') {
      return NextResponse.json(
        { 
          error: 'This listener is not currently accepting bookings. Their application is still under review.',
          status: listener.verification_status
        },
        { status: 403 }
      );
    }

    let result;

    if (booking_type === 'immediate') {
      result = await appointmentService.createImmediateAppointment(
        payload as CreateImmediateAppointmentPayload,
        true // use server client
      );
    } else if (booking_type === 'scheduled') {
      result = await appointmentService.createScheduledAppointment(
        payload as CreateScheduledAppointmentPayload,
        true
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid booking_type. Must be "immediate" or "scheduled"' },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: AppointmentFilterParams = {
      status: searchParams.get('status')?.split(',') as any,
      booking_type: searchParams.get('booking_type') as any,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      payment_status: searchParams.get('payment_status')?.split(',') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await appointmentService.getAppointments(filters, true);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
