/**
 * Admin Dashboard Analytics API
 * GET /api/admin/analytics/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth, isErrorResponse } from '@/middleware/admin-auth.middleware';

export async function GET(request: NextRequest) {
  // Authenticate admin
  const authResult = await withAdminAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const supabase = await createClient();

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      { count: totalUsers },
      { count: totalListeners },
      { count: verifiedListeners },
      { count: totalAppointments },
      { count: completedAppointments },
      { count: pendingApplications },
      { count: newUsersThisWeek },
      { data: revenueData },
      { data: appointmentsByStatus },
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      
      // Total listeners
      supabase.from('listeners').select('id', { count: 'exact', head: true }),
      
      // Verified listeners
      supabase.from('listeners').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      
      // Total appointments
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      
      // Completed appointments
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      
      // Pending applications
      supabase.from('listener_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      
      // New users this week
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
      
      // Revenue data (last 30 days)
      supabase
        .from('session_financials')
        .select('total_amount, platform_fee, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('financial_status', 'completed'),
      
      // Appointments by status
      supabase
        .from('appointments')
        .select('status')
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // Calculate revenue metrics
    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
    const platformRevenue = revenueData?.reduce((sum, item) => sum + (item.platform_fee || 0), 0) || 0;

    // Group revenue by day
    const revenueByDay = groupDataByDay(revenueData || [], 7, 'total_amount');

    // Count appointments by status
    const statusCounts = (appointmentsByStatus || []).reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalListeners: totalListeners || 0,
        verifiedListeners: verifiedListeners || 0,
        totalAppointments: totalAppointments || 0,
        completedAppointments: completedAppointments || 0,
        pendingApplications: pendingApplications || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
      },
      revenue: {
        total: totalRevenue,
        platform: platformRevenue,
        byDay: revenueByDay,
      },
      appointments: {
        byStatus: statusCounts,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper function to group data by day
function groupDataByDay(data: any[], days: number, sumField: string) {
  const result: { date: string; value: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayValue = data
      .filter(item => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0];
        return itemDate === dateStr;
      })
      .reduce((sum, item) => sum + (item[sumField] || 0), 0);

    result.push({ date: dateStr, value: dayValue });
  }

  return result;
}
