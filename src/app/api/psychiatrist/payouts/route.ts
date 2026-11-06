/**
 * Psychiatrist Payouts API Route
 * 
 * GET /api/psychiatrist/payouts - Get payout history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { financialService } from '@/services/financial.service';

// GET /api/psychiatrist/payouts
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

    const payoutHistory = await financialService.getPsychiatristPayoutHistory(
      user.id,
      true
    );

    return NextResponse.json(payoutHistory);
  } catch (error) {
    console.error('Error fetching payout history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch payout history' },
      { status: 500 }
    );
  }
}
