import type { Metadata } from "next";
import { DoctorProfileView } from "@/features/doctors/DoctorProfileView";

export const metadata: Metadata = { 
  title: "Doctor Profile | TalkFriendly",
};

export default function DoctorProfilePage({ params }: { params: { id: string } }) {
  return <DoctorProfileView doctorId={params.id} />;
}
