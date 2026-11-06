import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/features/admin/dashboard/DashboardStats";
import { RevenueChart } from "@/features/admin/dashboard/RevenueChart";
import { UserGrowthChart } from "@/features/admin/dashboard/UserGrowthChart";
import { RecentActivity } from "@/features/admin/dashboard/RecentActivity";
import { PendingApplications } from "@/features/admin/dashboard/PendingApplications";

export const metadata: Metadata = {
  title: "Admin Dashboard | TalkFriendly",
  description: "Platform overview and analytics",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch dashboard statistics
  const [
    { count: totalUsers },
    { count: totalListeners },
    { count: totalAppointments },
    { count: pendingApplications },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('listeners').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }),
    supabase.from('listener_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
  ]);

  // Fetch revenue data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: revenueData } = await supabase
    .from('session_financials')
    .select('total_amount, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .eq('financial_status', 'completed');

  // Calculate total revenue
  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

  // Fetch user growth data (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: newUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  // Group by day
  const userGrowthByDay = groupByDay(newUsers || [], 7);

  // Fetch recent appointments
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      user:profiles!user_id(full_name, username),
      listener:profiles!psychiatrist_id(full_name, username)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch recent applications
  const { data: recentApplications } = await supabase
    .from('listener_applications')
    .select('*')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats
        totalUsers={totalUsers || 0}
        totalListeners={totalListeners || 0}
        totalAppointments={totalAppointments || 0}
        totalRevenue={totalRevenue}
        pendingApplications={pendingApplications || 0}
        newUsersThisWeek={newUsers?.length || 0}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData || []} />
        <UserGrowthChart data={userGrowthByDay} />
      </div>

      {/* Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApplications applications={recentApplications || []} />
        <RecentActivity appointments={recentAppointments || []} />
      </div>
    </div>
  );
}

// Helper function to group data by day
function groupByDay(data: any[], days: number) {
  const result: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = data.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      return itemDate === dateStr;
    }).length;

    result.push({ date: dateStr, count });
  }

  return result;
}
