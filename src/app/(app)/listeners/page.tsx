import type { Metadata } from "next";
import { ListenersView } from "@/features/listeners/ListenersView";

export const metadata: Metadata = { title: "Find a Listener | TalkFriendly" };

export default function ListenersPage() {
  return <ListenersView />;
}
