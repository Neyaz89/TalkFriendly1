import type { Metadata } from "next";
import { RoleSelectionView } from "@/features/auth/RoleSelectionView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { 
  title: "Choose Your Account Type | TalkFriendly",
  description: "Choose whether you want to receive support or provide professional mental health services"
};

export default async function RoleSelectPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <RoleSelectionView />;
}
