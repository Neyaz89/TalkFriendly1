import type { Metadata } from "next";
import { MoodsView } from "@/features/moods/MoodsView";

export const metadata: Metadata = { title: "Mood Analytics | TalkFriendly" };

export default function MoodsPage() {
  return <MoodsView />;
}
