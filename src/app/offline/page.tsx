/**
 * Offline fallback page — shown when the device has no network connection.
 */

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🌿</div>
        <h1 className="text-2xl font-bold text-text mb-3">You&apos;re offline</h1>
        <p className="text-muted leading-relaxed mb-6">
          No internet connection right now. But remember — your wellbeing doesn&apos;t depend on WiFi.
          Take a breath. We&apos;ll be here when you&apos;re back.
        </p>
        <p className="text-sm text-muted italic">
          &ldquo;The present moment is the only moment available to us.&rdquo; — Thich Nhat Hanh
        </p>
      </div>
    </div>
  );
}
