import type { Metadata } from "next";
import { AboutView } from "@/features/legal/AboutView";

export const metadata: Metadata = { 
  title: "About | TalkFriendly",
  description: "Learn about TalkFriendly - your mental wellbeing companion designed to support your emotional health journey."
};

export default function AboutPage() {
  return <AboutView />;
}
