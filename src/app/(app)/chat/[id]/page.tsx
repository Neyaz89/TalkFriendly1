'use client';

/**
 * Redirect from old /chat/[id] to new /messages?conversation=[id]
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConversationRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new messages page with conversation ID
    router.replace(`/messages?conversation=${params.id}`);
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to conversation...</p>
    </div>
  );
}

