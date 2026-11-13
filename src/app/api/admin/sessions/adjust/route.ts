/**
 * API Route: Admin - Adjust Session Times
 * POST /api/admin/sessions/adjust
 * 
 * Admin-only endpoint to manually adjust session check-in/check-out times
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SessionAdjustmentRequest, SessionAdjustmentResponse } from '@/types/session-tracking.types';
import { validateSessionTimes } from '@/lib/session-duration-utils';

export async function POST(request: NextRequest) {
  try {
    const body: SessionAdjustmentRequest = await request.json();

    if (!body.session_id || !body.reason) {
      return NextResponse.json(
        { error: 'session_id and reason are required' },
        { status: 400 }
      );
    }

    if (!body.joined_at && !body.left_at) {
      return NextResponse.json(
        { error: 'At least one of joined_at or left_at must be provided' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type, name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('id', body.session_id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Prepare updated values
    const joinedAt = body.joined_at ? new Date(body.joined_at) : new Date(existingSession.joined_at);
    const leftAt = body.left_at ? new Date(body.left_at) : (existingSession.left_at ? new Date(existingSession.left_at) : null);

    // Validate times if both are present
    if (leftAt) {
      const validation = validateSessionTimes(joinedAt, leftAt);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Calculate new duration
    const durationSeconds = leftAt 
      ? Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000)
      : null;

    // Update session
    const updateData: any = {
      source: 'manual_adjustment',
      updated_at: new Date().toISOString(),
    };

    if (body.joined_at) {
      updateData.joined_at = joinedAt.toISOString();
    }

    if (body.left_at) {
      updateData.left_at = leftAt.toISOString();
    }

    if (durationSeconds !== null) {
      updateData.duration_seconds = durationSeconds;
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('participant_sessions')
      .update(updateData)
      .eq('id', body.session_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    // Log the adjustment
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: user.id,
        action_type: 'session_adjustment',
        action_description: `Adjusted session times for appointment ${existingSession.appointment_id}`,
        metadata: {
          session_id: body.session_id,
          appointment_id: existingSession.appointment_id,
          reason: body.reason,
          old_joined_at: existingSession.joined_at,
          new_joined_at: body.joined_at || existingSession.joined_at,
          old_left_at: existingSession.left_at,
          new_left_at: body.left_at || existingSession.left_at,
        },
      });

    // Create or update session review notes
    await supabase
      .from('session_reviews')
      .upsert({
        appointment_id: existingSession.appointment_id,
        admin_id: user.id,
        notes: `Admin adjustment: ${body.reason}`,
        reviewed_at: new Date().toISOString(),
      }, {
        onConflict: 'appointment_id',
      });

    console.log('✅ Session adjusted by admin:', {
      sessionId: body.session_id,
      adminId: user.id,
      reason: body.reason,
    });

    const response: SessionAdjustmentResponse = {
      success: true,
      session: updatedSession,
      message: 'Session times adjusted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error adjusting session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust session' },
      { status: 500 }
    );
  }
}
