'use client';

/**
 * Redirect from old /chat to new /messages
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ChatRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any query parameters
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    
    // Redirect to new messages page
    router.replace(`/messages${queryString ? `?${queryString}` : ''}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to messages...</p>
    </div>
  );
}
