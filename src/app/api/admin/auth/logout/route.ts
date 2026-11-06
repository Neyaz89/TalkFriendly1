/**
 * Admin Logout API
 * POST /api/admin/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminActivity } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { session_token } = await request.json();

    if (!session_token) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('admin_id')
      .eq('session_token', session_token)
      .single();

    if (!sessionError && session) {
      // Log logout activity
      await logAdminActivity(
        session.admin_id,
        'admin_logout',
        'admin_session',
        undefined,
        { session_token }
      );

      // End session
      await supabase
        .from('admin_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('session_token', session_token);
    }

    // Sign out from Supabase
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
