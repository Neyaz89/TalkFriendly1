/**
 * Admin Authentication & Authorization Middleware
 * Protects admin routes and checks permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminServer, hasPermission, hasAnyPermission } from '@/lib/admin-auth';
import type { AdminUser } from '@/types/admin.types';

export interface AdminAuthMiddlewareOptions {
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAny?: boolean; // If true, user needs ANY of the permissions. If false, needs ALL
}

/**
 * Middleware to protect admin routes
 */
export async function withAdminAuth(
  request: NextRequest,
  options?: AdminAuthMiddlewareOptions
): Promise<{ admin: AdminUser } | NextResponse> {
  try {
    const admin = await getCurrentAdminServer();

    if (!admin) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions if specified
    if (options?.requiredPermission) {
      if (!hasPermission(admin, options.requiredPermission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    if (options?.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasAccess = options.requireAny
        ? hasAnyPermission(admin, options.requiredPermissions)
        : options.requiredPermissions.every((p) => hasPermission(admin, p));

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return { admin };
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Helper to require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<{ admin: AdminUser } | NextResponse> {
  return withAdminAuth(request, { requiredPermission: permission });
}

/**
 * Helper to require any of multiple permissions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: string[]
): Promise<{ admin: AdminUser } | NextResponse> {
  return withAdminAuth(request, { requiredPermissions: permissions, requireAny: true });
}

/**
 * Helper to require all of multiple permissions
 */
export async function requireAllPermissions(
  request: NextRequest,
  permissions: string[]
): Promise<{ admin: AdminUser } | NextResponse> {
  return withAdminAuth(request, { requiredPermissions: permissions, requireAny: false });
}

/**
 * Helper to check if response is an error (NextResponse)
 */
export function isErrorResponse(
  result: { admin: AdminUser } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
