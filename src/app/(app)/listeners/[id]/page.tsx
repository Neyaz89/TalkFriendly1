import type { Metadata } from "next";
import { ListenerProfileView } from "@/features/listeners/ListenerProfileView";

export const metadata: Metadata = { title: "Listener Profile | TalkFriendly" };

export default async function ListenerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListenerProfileView listenerId={id} />;
}
