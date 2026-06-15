'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-runs the server component on an interval until the book reaches a terminal
// status. When that happens the parent stops rendering this component, so the
// effect cleanup clears the interval.
export default function StatusPoller({ intervalMs = 2500 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);
  return null;
}
