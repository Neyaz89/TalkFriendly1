import type { Metadata } from "next";
import { CommunityDetailView } from "@/features/communities/CommunityDetailView";

export const metadata: Metadata = { title: "Community | TalkFriendly" };

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommunityDetailView communityId={id} />;
}
