/**
 * Admin Financial Overview API Route
 * 
 * GET /api/admin/financials/overview - Platform financial metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { financialService } from '@/services/financial.service';

// GET /api/admin/financials/overview
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from_date') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
    const toDate = searchParams.get('to_date') || new Date().toISOString();

    const overview = await financialService.getPlatformFinancialOverview(
      fromDate,
      toDate,
      true
    );

    return NextResponse.json(overview);
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch financial overview' },
      { status: 500 }
    );
  }
}
