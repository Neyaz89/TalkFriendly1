import type { Metadata } from "next";
import { TermsOfServiceView } from "@/features/legal/TermsOfServiceView";

export const metadata: Metadata = { 
  title: "Terms of Service | TalkFriendly",
  description: "Read the terms and conditions for using TalkFriendly."
};

export default function TermsPage() {
  return <TermsOfServiceView />;
}
