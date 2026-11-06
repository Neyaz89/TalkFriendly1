/**
 * Get Current Admin User API
 * GET /api/admin/auth/me
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminServer } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdminServer();

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        user_id: admin.user_id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error('Error getting admin user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
