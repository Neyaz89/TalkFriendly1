import type { Metadata } from "next";
import { CommunityGuidelinesView } from "@/features/legal/CommunityGuidelinesView";

export const metadata: Metadata = { 
  title: "Community Guidelines | TalkFriendly",
  description: "Help us keep TalkFriendly a safe and welcoming space for everyone."
};

export default function CommunityGuidelinesPage() {
  return <CommunityGuidelinesView />;
}
