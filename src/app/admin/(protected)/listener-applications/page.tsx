import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ApplicationsList } from "@/features/admin/listener-applications/ApplicationsList";

export const metadata: Metadata = {
  title: "Listener Applications | Admin",
  description: "Review and manage listener applications",
};

export default async function ListenerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || 'all';
  const page = parseInt(params.page || '1');
  const limit = 20;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('listener_applications')
    .select('*', { count: 'exact' })
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Filter by status
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('Error fetching applications:', error);
  }

  // Get status counts for filter tabs
  const { data: statusCounts } = await supabase
    .from('listener_applications')
    .select('status');

  const counts = (statusCounts || []).reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Listener Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage professional listener applications</p>
      </div>

      <ApplicationsList
        applications={applications || []}
        totalCount={count || 0}
        currentPage={page}
        currentStatus={status}
        statusCounts={counts}
        limit={limit}
      />
    </div>
  );
}
