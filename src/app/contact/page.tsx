import type { Metadata } from "next";
import { ContactView } from "@/features/legal/ContactView";

export const metadata: Metadata = { 
  title: "Contact Us | TalkFriendly",
  description: "Get in touch with the TalkFriendly team. We're here to help with any questions or concerns."
};

export default function ContactPage() {
  return <ContactView />;
}
