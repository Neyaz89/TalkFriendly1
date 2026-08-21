import type { Metadata } from "next";
import { CirclesView } from "@/features/circles/CirclesView";

export const metadata: Metadata = { title: "Listening Circles | TalkFriendly" };

export default function CirclesPage() {
  return <CirclesView />;
}
