import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create Account | TalkFriendly" };

export default async function RegisterPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
