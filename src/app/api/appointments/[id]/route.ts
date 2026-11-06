/**
 * Single Appointment API Routes
 * 
 * GET    /api/appointments/[id] - Get appointment details
 * PATCH  /api/appointments/[id] - Update appointment
 * DELETE /api/appointments/[id] - Cancel appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment.service';
import type {
  UpdateAppointmentPayload,
  CancelAppointmentPayload,
} from '@/types';

// GET /api/appointments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await appointmentService.getAppointmentById(
      params.id,
      true
    );

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateAppointmentPayload = await request.json();

    const appointment = await appointmentService.updateAppointment(
      params.id,
      body,
      true
    );

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: CancelAppointmentPayload = await request.json();

    const appointment = await appointmentService.cancelAppointment(
      params.id,
      body,
      true
    );

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
