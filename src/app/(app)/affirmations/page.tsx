import type { Metadata } from "next";
import { AffirmationsView } from "@/features/affirmations/AffirmationsView";

export const metadata: Metadata = { title: "Affirmations | TalkFriendly" };

export default function AffirmationsPage() {
  return <AffirmationsView />;
}
