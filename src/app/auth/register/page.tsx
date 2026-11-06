import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create Account | TalkFriendly" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Await searchParams in Next.js 15
  const params = await searchParams;
  const role = params.role;
  
  // If no role specified, redirect to role selection
  if (!role || (role !== 'user' && role !== 'listener')) {
    redirect("/auth/register/role-select");
  }

  return <RegisterForm role={role as 'user' | 'listener'} />;
}
