/**
 * API Route: Search Users
 * GET /api/connections/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role') || undefined;
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

    let dbQuery = supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, bio, profession, created_at', {
        count: 'exact',
      })
      .neq('id', user.id);

    // Search by username or full name
    if (query) {
      dbQuery = dbQuery.or(
        `username.ilike.%${query}%,full_name.ilike.%${query}%`
      );
    }

    // Filter by profession
    if (role) {
      dbQuery = dbQuery.ilike('profession', `%${role}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    dbQuery = dbQuery.range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Get connection status for each user
    const usersWithStatus = await Promise.all(
      (data || []).map(async (profile) => {
        const { data: connection } = await supabase
          .from('user_connections')
          .select('*')
          .or(
            `and(user_id.eq.${user.id},connected_user_id.eq.${profile.id}),and(user_id.eq.${profile.id},connected_user_id.eq.${user.id})`
          )
          .single();

        let connectionStatus = 'none';
        let connectionId = null;

        if (connection) {
          connectionId = connection.id;
          if (connection.status === 'blocked') {
            connectionStatus = 'blocked';
          } else if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          } else if (connection.status === 'pending') {
            connectionStatus = connection.user_id === user.id ? 'pending_sent' : 'pending_received';
          }
        }

        return {
          ...profile,
          role: 'user',
          connection_status: connectionStatus,
          connection_id: connectionId,
          stats: {
            total_connections: 0,
          },
        };
      })
    );

    return NextResponse.json({
      users: usersWithStatus,
      total: count || 0,
    });
  } catch (error: any) {
    console.error('❌ Error searching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
