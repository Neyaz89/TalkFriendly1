/**
 * API Route: List Session Booking Forms
 * GET /api/forms/list
 * 
 * Returns all booking forms created by the authenticated listener.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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

    // Verify user is a listener
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'listener') {
      return NextResponse.json(
        { error: 'Only listeners can view booking forms' },
        { status: 403 }
      );
    }

    // Fetch all booking forms created by this listener
    const { data: forms, error: formsError } = await supabase
      .from('session_booking_forms')
      .select(`
        *,
        bookings:session_bookings(count)
      `)
      .eq('listener_id', user.id)
      .order('created_at', { ascending: false });

    if (formsError) {
      console.error('❌ Error fetching booking forms:', formsError);
      throw new Error(`Failed to fetch booking forms: ${formsError.message}`);
    }

    // Add booking count to each form
    const formsWithStats = (forms || []).map(form => ({
      ...form,
      booking_count: form.bookings?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      forms: formsWithStats,
    });
  } catch (error: any) {
    console.error('❌ Error listing booking forms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list booking forms' },
      { status: 500 }
    );
  }
}
