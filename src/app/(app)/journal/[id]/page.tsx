import type { Metadata } from "next";
import { JournalEntryView } from "@/features/journal/JournalEntryView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: entry?.title ? `${entry.title} | Journal | TalkFriendly` : "Journal Entry | TalkFriendly",
  };
}

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }
  
  return <JournalEntryView entryId={id} />;
}
