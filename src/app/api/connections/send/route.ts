/**
 * API Route: Send Connection Request
 * POST /api/connections/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.target_user_id) {
      return NextResponse.json(
        { error: 'target_user_id is required' },
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

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${body.target_user_id}),and(user_id.eq.${body.target_user_id},connected_user_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Connection request already exists' },
        { status: 400 }
      );
    }

    // Create connection request
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.id,
        connected_user_id: body.target_user_id,
        initiated_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send connection request: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      connection: data,
    });
  } catch (error: any) {
    console.error('❌ Error sending connection request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send connection request' },
      { status: 500 }
    );
  }
}
