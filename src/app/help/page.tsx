import type { Metadata } from "next";
import { HelpCentreView } from "@/features/legal/HelpCentreView";

export const metadata: Metadata = { 
  title: "Help Centre | TalkFriendly",
  description: "Get help with your TalkFriendly account, AI conversations, listener sessions, subscriptions, and more."
};

export default function HelpPage() {
  return <HelpCentreView />;
}
