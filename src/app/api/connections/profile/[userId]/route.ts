/**
 * API Route: Get User Profile with Connection Status
 * GET /api/connections/profile/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get connection status
    const { data: connection } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${user.id})`
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

    // Get connection count
    const { count } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);

    return NextResponse.json({
      ...profile,
      role: 'user',
      connection_status: connectionStatus,
      connection_id: connectionId,
      stats: {
        total_connections: count || 0,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
