/**
 * Login page.
 */

import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In | TalkFriendly",
};

export default async function LoginPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
