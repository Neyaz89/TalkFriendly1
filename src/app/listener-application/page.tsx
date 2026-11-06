import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApplicationStatusView } from "@/features/listener-application/ApplicationStatusView";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { 
  title: "Application Status | TalkFriendly",
  description: "Track your Listener application status"
};

export default async function ApplicationStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Show success message for new submissions
  if (params.success === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a TalkFriendly Listener. Your application is now under review.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">What's Next:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Our team will review your application (2-5 business days)</li>
              <li>You'll receive an email update on your status</li>
              <li>Once approved, you can start accepting bookings</li>
            </ul>
          </div>
          <Link
            href="/auth/login"
            className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Sign In to Your Account
          </Link>
        </div>
      </div>
    );
  }

  // Must be logged in to view status
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
