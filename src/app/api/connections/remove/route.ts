/**
 * API Route: Remove/Cancel Connection
 * DELETE /api/connections/remove
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connection_id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connection_id is required' },
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

    // Delete the connection
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', connectionId)
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    if (error) {
      throw new Error(`Failed to remove connection: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Connection removed successfully',
    });
  } catch (error: any) {
    console.error('❌ Error removing connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove connection' },
      { status: 500 }
    );
  }
}
