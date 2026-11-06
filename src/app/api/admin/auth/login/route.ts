/**
 * Admin Login API
 * POST /api/admin/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminActivity } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile || profile.account_type !== 'admin') {
      // Sign out if not admin
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get admin user details with role and permissions
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        role:admin_roles(
          *,
          permissions:admin_permissions(*)
        )
      `)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Admin account not found or inactive' },
        { status: 403 }
      );
    }

    // Generate session token
    const sessionToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour sessions

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: adminUser.id,
        user_id: authData.user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create admin session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Log admin login
    await logAdminActivity(
      adminUser.id,
      'admin_login',
      'admin_session',
      session.id,
      { email, ip_address: ipAddress }
    );

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        user_id: adminUser.user_id,
        username: adminUser.username,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
      },
      session: {
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
