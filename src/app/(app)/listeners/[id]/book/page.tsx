import type { Metadata } from "next";
import { BookingFlow } from "@/features/listeners/BookingFlow";

export const metadata: Metadata = { title: "Book a Session | TalkFriendly" };

export default async function BookListenerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingFlow listenerId={id} />;
}
