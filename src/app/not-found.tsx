/**
 * 404 Not Found page.
 */

import Link from "next/link";
import { ROUTES } from "@/constants";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="text-3xl font-bold text-text mb-3">Page not found</h1>
        <p className="text-muted leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist — but your wellness journey does.
        </p>
        <Link
          href={ROUTES.DASHBOARD}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
