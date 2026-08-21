import type { Metadata } from "next";
import { ProfileView } from "@/features/profile/ProfileView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Edit Profile | TalkFriendly" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <ProfileView user={user} profile={profile} />;
}
