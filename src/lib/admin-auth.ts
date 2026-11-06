/**
 * Admin Authentication & Authorization
 * Handles admin login, sessions, and permission checks
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { AdminUser, AdminPermission } from '@/types/admin.types';

export interface AdminSession {
  id: string;
  admin_id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
}

export interface AdminAuthResult {
  success: boolean;
  admin?: AdminUser;
  session?: AdminSession;
  error?: string;
}

/**
 * Admin login (client-side)
 */
export async function adminLogin(email: string, password: string): Promise<AdminAuthResult> {
  const supabase = createClient();

  try {
    // First, authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed' };
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
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        role:admin_roles(*)
      `)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      await supabase.auth.signOut();
      return { success: false, error: 'Admin account not found or inactive' };
    }

    // Create admin session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12); // 12 hour sessions

    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: adminUser.id,
        user_id: authData.user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: null, // Will be set by API
        user_agent: navigator.userAgent,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create admin session:', sessionError);
    }

    // Store session token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_session_token', sessionToken);
    }

    return {
      success: true,
      admin: adminUser as AdminUser,
      session: session as AdminSession,
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Admin logout (client-side)
 */
export async function adminLogout(): Promise<void> {
  const supabase = createClient();

  try {
    // Get session token
    const sessionToken = typeof window !== 'undefined'
      ? localStorage.getItem('admin_session_token')
      : null;

    if (sessionToken) {
      // Mark session as ended
      await supabase
        .from('admin_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('session_token', sessionToken);

      // Remove from localStorage
      localStorage.removeItem('admin_session_token');
    }

    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Admin logout error:', error);
  }
}

/**
 * Get current admin user (client-side)
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        role:admin_roles(
          *,
          permissions:admin_permissions(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) return null;

    return adminUser as AdminUser;
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

/**
 * Get current admin user (server-side)
 */
export async function getCurrentAdminServer(): Promise<AdminUser | null> {
  const supabase = await createServerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        role:admin_roles(
          *,
          permissions:admin_permissions(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) return null;

    return adminUser as AdminUser;
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: AdminUser, permission: string): boolean {
  if (!admin || !admin.role) return false;

  // Super admin has all permissions
  if (admin.role.name === 'super_admin') return true;

  // Check role permissions
  const permissions = admin.role.permissions || [];
  return permissions.some((p: AdminPermission) => p.permission_key === permission);
}

/**
 * Check if admin has any of the specified permissions
 */
export function hasAnyPermission(admin: AdminUser, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(admin, p));
}

/**
 * Check if admin has all specified permissions
 */
export function hasAllPermissions(admin: AdminUser, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(admin, p));
}

/**
 * Validate admin session (server-side)
 */
export async function validateAdminSession(sessionToken: string): Promise<AdminUser | null> {
  const supabase = await createServerClient();

  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .is('ended_at', null)
      .single();

    if (sessionError || !session) return null;

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('admin_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', session.id);
      return null;
    }

    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        role:admin_roles(
          *,
          permissions:admin_permissions(*)
        )
      `)
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) return null;

    // Update last activity
    await supabase
      .from('admin_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return adminUser as AdminUser;
  } catch (error) {
    console.error('Error validating admin session:', error);
    return null;
  }
}

/**
 * Generate secure session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  const supabase = createClient();

  try {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: null, // Will be captured by API
    });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
}
