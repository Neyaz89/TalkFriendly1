import type { Metadata } from "next";
import { FeedView } from "@/features/feed/FeedView";

export const metadata: Metadata = { 
  title: "Community Feed | TalkFriendly",
  description: "Connect with the TalkFriendly community, share your thoughts, and discover others"
};

export default function FeedPage() {
  return <FeedView />;
}
