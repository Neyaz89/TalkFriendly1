/**
 * API Route: Get Pending Connection Requests
 * GET /api/connections/requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for API route
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

    const { data, error, count } = await supabase
      .from('user_connections')
      .select(
        `
        id,
        status,
        created_at,
        from_user:profiles!user_id(id, username, full_name, avatar_url, profession)
      `,
        { count: 'exact' }
      )
      .eq('connected_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch connection requests: ${error.message}`);
    }

    return NextResponse.json({
      requests: data || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching connection requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connection requests' },
      { status: 500 }
    );
  }
}
