'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fires a lightweight beacon to /api/track on every navigation.
 * Debounced so rapid SPA navigations don't flood the endpoint.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    // Don't re-track the same path on re-renders
    if (pathname === sent.current) return;
    sent.current = pathname;

    const timer = setTimeout(() => {
      // Skip admin pages — we only want public traffic
      if (pathname.startsWith('/superadmin')) return;

      const payload = {
        path: pathname,
        referrer: document.referrer || null,
      };

      // Use sendBeacon for reliability (survives page unloads)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', JSON.stringify(payload));
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
