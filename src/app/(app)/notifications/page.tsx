import type { Metadata } from "next";
import { NotificationsView } from "@/features/notifications/NotificationsView";

export const metadata: Metadata = { 
  title: "Notifications | TalkFriendly",
  description: "Your notifications and updates"
};

export default function NotificationsPage() {
  return <NotificationsView />;
}
