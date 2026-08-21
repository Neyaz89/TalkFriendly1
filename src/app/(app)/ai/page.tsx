import type { Metadata } from "next";
import { AiCompanionView } from "@/features/ai/AiCompanionView";

export const metadata: Metadata = { title: "AI Companion | TalkFriendly" };

export default function AiPage() {
  return <AiCompanionView />;
}
