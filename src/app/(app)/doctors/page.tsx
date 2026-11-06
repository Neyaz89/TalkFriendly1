'use client';

/**
 * Redirect from /doctors to /listeners
 * Doctors and listeners are now unified
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/listeners');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to listeners...</p>
    </div>
  );
}
