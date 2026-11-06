import type { Metadata } from "next";
import { PrivacySettings } from "@/features/settings/PrivacySettings";

export const metadata: Metadata = { 
  title: "Privacy Settings | TalkFriendly",
  description: "Manage your privacy and security settings"
};

export default function PrivacySettingsPage() {
  return <PrivacySettings />;
}
