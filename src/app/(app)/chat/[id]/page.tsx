'use client';

/**
 * Redirect from old /chat/[id] to new /messages?conversation=[id]
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function ConversationRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    // Redirect to new messages page with conversation ID
    router.replace(`/messages?conversation=${id}`);
  }, [router, id]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to conversation...</p>
    </div>
  );
}

