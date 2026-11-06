/**
 * API Route: Get User's Connections
 * GET /api/connections/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Get connections where user is either user_id OR connected_user_id
    let query = supabase
      .from('user_connections')
      .select(
        `
        *,
        user_profile:profiles!user_id(id, username, full_name, email, avatar_url, bio, profession),
        connected_user_profile:profiles!connected_user_id(id, username, full_name, email, avatar_url, bio, profession)
      `,
        { count: 'exact' }
      )
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'accepted');
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    // Transform data to show the OTHER user's profile
    const transformedConnections = (data || []).map((conn: any) => {
      const isUserInitiator = conn.user_id === user.id;
      const otherUserProfile = isUserInitiator 
        ? conn.connected_user_profile 
        : conn.user_profile;

      return {
        ...conn,
        connected_user: otherUserProfile,
      };
    });

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .eq('connected_user_id', user.id)
      .eq('status', 'pending');

    return NextResponse.json({
      connections: transformedConnections,
      total: count || 0,
      pending_requests_count: pendingCount || 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching connections:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
