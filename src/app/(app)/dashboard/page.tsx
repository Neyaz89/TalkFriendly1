import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard | TalkFriendly" };

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <DashboardView />;
}
