import type { Metadata } from "next";
import { DoctorProfileView } from "@/features/doctors/DoctorProfileView";

export const metadata: Metadata = { 
  title: "Doctor Profile | TalkFriendly",
};

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorProfileView doctorId={id} />;
}
