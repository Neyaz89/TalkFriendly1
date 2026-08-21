"use client";

/**
 * OTP verification page.
 * Wrapped in Suspense because it uses useSearchParams.
 */

import React, { Suspense } from "react";
import { OtpForm } from "./OtpForm";
import { PageLoader } from "@/components/common/LoadingSpinner";

export default function OtpPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OtpForm />
    </Suspense>
  );
}
