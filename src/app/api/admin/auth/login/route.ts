/**
 * Admin Login API
 * POST /api/admin/auth/login
 * 
 * SECURE ADMIN AUTHENTICATION
 * This endpoint uses dedicated admin credentials stored in environment variables,
 * NOT regular Supabase user authentication. Admin credentials are validated
 * server-side only and never exposed to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminCredentials, areAdminCredentialsConfigured } from '@/lib/admin-credentials';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if admin credentials are configured
    if (!areAdminCredentialsConfigured()) {
      console.error('ADMIN_CREDENTIALS not configured!');
      return NextResponse.json(
        { error: 'Admin authentication is not configured' },
        { status: 500 }
      );
    }

    // Get IP address for logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify admin credentials against environment variables
    const credential = await verifyAdminCredentials(username, password);

    if (!credential) {
      // Log failed login attempt
      console.warn(`Failed admin login attempt: ${username} from ${ipAddress}`);
      
      // Return generic error to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', credential.userId)
      .eq('account_type', 'admin')
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      console.error('Admin profile not found or inactive:', credential.userId);
      return NextResponse.json(
        { error: 'Admin account not found or inactive' },
        { status: 403 }
      );
    }

    // Get admin permissions
    const { data: permissions } = await supabase
      .from('admin_permissions')
      .select('permission')
      .eq('user_id', profile.id)
      .eq('is_active', true);

    const permissionList = (permissions || []).map((p) => p.permission);

    // Generate session token
    const sessionToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour sessions

    // Create admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: profile.id,
        session_token: sessionToken,
        mfa_verified: false,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
        expires_at: expiresAt.toISOString(),
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

    // Log successful admin login
    await supabase.from('admin_activity_log').insert({
      admin_user_id: profile.id,
      admin_username: profile.username,
      admin_email: profile.email,
      action_type: 'login',
      action_description: `Admin user ${username} logged in successfully`,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        session_id: session.id,
        login_method: 'credentials',
      },
    });

    console.log(`Admin login successful: ${username} from ${ipAddress}`);

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        account_type: profile.account_type,
      },
      permissions: permissionList,
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
