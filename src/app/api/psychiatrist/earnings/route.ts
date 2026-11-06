/**
 * Psychiatrist Earnings API Route
 * 
 * GET /api/psychiatrist/earnings - Get earnings summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { financialService } from '@/services/financial.service';

// GET /api/psychiatrist/earnings
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

    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    const earnings = await financialService.getPsychiatristEarnings(
      {
        psychiatrist_id: user.id,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      },
      true
    );

    // Get recent sessions
    const { data: recentAppointments } = await supabase
      .from('appointments')
      .select('id, scheduled_start_time, duration_minutes, session_financials(*)')
      .eq('psychiatrist_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_start_time', { ascending: false })
      .limit(10);

    const recentSessions = (recentAppointments || []).map((appointment) => ({
      appointment_id: appointment.id,
      date: appointment.scheduled_start_time,
      duration_minutes: appointment.duration_minutes,
      amount_earned: appointment.session_financials?.[0]?.net_psychiatrist_payout || 0,
      payout_status: appointment.session_financials?.[0]?.financial_status || 'pending',
    }));

    return NextResponse.json({
      earnings,
      recent_sessions: recentSessions,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
