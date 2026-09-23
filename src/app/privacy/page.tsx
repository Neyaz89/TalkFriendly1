import type { Metadata } from "next";
import { PrivacyPolicyView } from "@/features/legal/PrivacyPolicyView";

export const metadata: Metadata = { 
  title: "Privacy Policy | TalkFriendly",
  description: "Learn how TalkFriendly collects, uses, and protects your personal information."
};

export default function PrivacyPage() {
  return <PrivacyPolicyView />;
}
