import type { Metadata } from "next";
import { CheckInView } from "@/features/moods/CheckInView";

export const metadata: Metadata = { title: "Daily Check-in | TalkFriendly" };

export default function CheckInPage() {
  return <CheckInView />;
}
