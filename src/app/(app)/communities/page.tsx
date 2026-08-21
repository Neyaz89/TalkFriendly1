import type { Metadata } from "next";
import { CommunitiesView } from "@/features/communities/CommunitiesView";

export const metadata: Metadata = { title: "Communities | TalkFriendly" };

export default function CommunitiesPage() {
  return <CommunitiesView />;
}
