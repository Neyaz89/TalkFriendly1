import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApplicationReview } from "@/features/admin/listener-applications/ApplicationReview";

export const metadata: Metadata = {
  title: "Review Application | Admin",
  description: "Review listener application details",
};

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch application
  const { data: application, error } = await supabase
    .from('listener_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !application) {
    redirect('/admin/listener-applications');
  }

  // Fetch application history
  const { data: history } = await supabase
    .from('application_status_history')
    .select(`
      *,
      admin:admin_users!changed_by(username, full_name)
    `)
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  return (
    <ApplicationReview 
      application={application} 
      history={history || []}
    />
  );
}
