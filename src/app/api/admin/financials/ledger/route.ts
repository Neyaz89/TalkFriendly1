/**
 * Admin Financial Ledger API Route
 * 
 * GET /api/admin/financials/ledger - Transaction ledger
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { financialService } from '@/services/financial.service';
import type { LedgerQueryParams } from '@/types';

// GET /api/admin/financials/ledger
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
    
    const params: LedgerQueryParams = {
      appointment_id: searchParams.get('appointment_id') || undefined,
      transaction_type: searchParams.get('transaction_type')?.split(',') as any,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      party: searchParams.get('party') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const ledger = await financialService.getLedgerEntries(params, true);

    return NextResponse.json(ledger);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ledger' },
      { status: 500 }
    );
  }
}
