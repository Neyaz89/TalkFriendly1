import type { Metadata } from "next";
import { CookiePolicyView } from "@/features/legal/CookiePolicyView";

export const metadata: Metadata = { 
  title: "Cookie Policy | TalkFriendly",
  description: "Learn about how TalkFriendly uses cookies and similar technologies."
};

export default function CookiesPage() {
  return <CookiePolicyView />;
}
