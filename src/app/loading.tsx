/**
 * Global loading UI — shown during page-level Suspense.
 */

import { PageLoader } from "@/components/common/LoadingSpinner";

export default function GlobalLoading() {
  return <PageLoader />;
}
