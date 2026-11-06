/**
 * API Route: Respond to Connection Request
 * POST /api/connections/respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.connection_id || !body.status) {
      return NextResponse.json(
        { error: 'connection_id and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be either "accepted" or "rejected"' },
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

    const { data, error } = await supabase
      .from('user_connections')
      .update({ status: body.status })
      .eq('id', body.connection_id)
      .eq('connected_user_id', user.id) // Only receiver can respond
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to respond to connection: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error: any) {
    console.error('❌ Error responding to connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to respond to connection' },
      { status: 500 }
    );
  }
}
