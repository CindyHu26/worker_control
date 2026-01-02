/**
 * Page View Tracker Hook
 * Automatically tracks time spent on each page and sends to backend
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePageViewTracker() {
    const pathname = usePathname();
    const startTime = useRef<number>(Date.now());
    const prevPathname = useRef<string>(pathname);

    useEffect(() => {
        // When pathname changes, send the previous page view duration
        if (prevPathname.current !== pathname && prevPathname.current) {
            const duration = Date.now() - startTime.current;

            // Send page view event to backend (don't await)
            fetch('/api/audit-logs/page-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include auth cookies
                body: JSON.stringify({
                    path: prevPathname.current,
                    duration,
                    metadata: {
                        referrer: document.referrer,
                        screenWidth: window.screen.width,
                        screenHeight: window.screen.height,
                    },
                }),
            }).catch(err => {
                console.warn('Failed to track page view:', err);
            });
        }

        // Update refs
        prevPathname.current = pathname;
        startTime.current = Date.now();

        // Track on unmount (page close/refresh)
        return () => {
            const duration = Date.now() - startTime.current;

            // Use sendBeacon for reliable tracking on page unload
            if (navigator.sendBeacon) {
                const data = JSON.stringify({
                    path: pathname,
                    duration,
                    metadata: { unload: true },
                });

                navigator.sendBeacon('/api/audit-logs/page-view', data);
            }
        };
    }, [pathname]);
}
