import { redirect } from "next/navigation";
import { getCurrentAdminServer } from "@/lib/admin-auth";
import { AdminNavigation } from "@/features/admin/AdminNavigation";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdminServer();

  // Redirect to login if not authenticated
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation admin={admin} />
      <main className="lg:pl-64">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
