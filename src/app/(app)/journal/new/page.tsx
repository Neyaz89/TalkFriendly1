import type { Metadata } from "next";
import { JournalEditor } from "@/features/journal/JournalEditor";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "New Entry | Journal | TalkFriendly" };

export default async function NewJournalPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <JournalEditor />;
}
