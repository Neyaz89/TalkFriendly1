import type { Metadata } from "next";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Login | TalkFriendly",
  description: "Administrator access portal",
};

export default async function AdminLoginPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in as admin, redirect to dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (profile?.account_type === 'admin') {
      redirect("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-400">
            Secure administrator access
          </p>
        </div>

        {/* Login Form */}
        <AdminLoginForm />

        {/* Warning */}
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
          <p className="text-sm text-yellow-200 text-center">
            <strong className="font-semibold">Restricted Access:</strong> This portal is for authorized administrators only. All access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
