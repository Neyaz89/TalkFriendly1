import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApplicationStatusView } from "@/features/listener-application/ApplicationStatusView";

export const metadata: Metadata = { 
  title: "Application Status | TalkFriendly",
  description: "Track your Listener application status"
};

export default async function ApplicationStatusPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) {
    redirect("/auth/login");
  }

  // Get user's application
  const { data: application } = await supabase
    .from('listener_applications')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get application history
  let history = [];
  if (application) {
    const { data: historyData } = await supabase
      .from('application_status_history')
      .select(`
        *,
        admin:changed_by (
          username,
          full_name
        )
      `)
      .eq('application_id', application.id)
      .order('created_at', { ascending: false });
    
    history = historyData || [];
  }

  return (
    <ApplicationStatusView 
      application={application} 
      history={history}
    />
  );
}
