import type { Metadata } from "next";
import { SimplifiedListenerForm } from "@/features/listener-application/SimplifiedListenerForm";

export const metadata: Metadata = { 
  title: "Listener Application | TalkFriendly",
  description: "Complete your professional Listener application"
};

export default async function ListenerApplicationPage() {
  // No login check - allow anyone to start application
  // Account will be created at the end of the form
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <SimplifiedListenerForm />
    </div>
  );
}
