import type { Metadata } from "next";
import { EventsView } from "@/features/events/EventsView";

export const metadata: Metadata = { title: "Events | TalkFriendly" };

export default function EventsPage() {
  return <EventsView />;
}
