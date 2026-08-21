import type { Metadata } from "next";
import { JournalListView } from "@/features/journal/JournalListView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Journal | TalkFriendly" };

export default async function JournalPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <JournalListView />;
}
