import type { Metadata } from "next";
import { MatchingView } from "@/features/matching/MatchingView";

export const metadata: Metadata = { title: "Find Your People | TalkFriendly" };

export default function MatchingPage() {
  return <MatchingView />;
}
