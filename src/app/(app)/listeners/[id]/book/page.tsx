import type { Metadata } from "next";
import { BookingFlow } from "@/features/listeners/BookingFlow";

export const metadata: Metadata = { title: "Book Session | TalkFriendly" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingFlow listenerId={id} />;
}
