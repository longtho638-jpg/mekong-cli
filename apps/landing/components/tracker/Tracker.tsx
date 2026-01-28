'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnalyticsEventType } from '@/lib/builder/types';

interface TrackerProps {
  landingPageId: string; // UUID
  variantId?: string;
  endpoint?: string;
}

export const Tracker: React.FC<TrackerProps> = ({
  landingPageId,
  variantId,
  endpoint = 'http://localhost:8000/api/landing-pages/analytics/events' // Default to local backend
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sendEvent = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      const payload = {
        landing_page_uuid: landingPageId,
        variant_id: variantId,
        event_type: eventType,
        metadata: {
          path: pathname,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          ...metadata
        }
      };

      // Use beacon if available for better reliability on unload
      // Note: navigator.sendBeacon is widely supported but we fallback to fetch for consistency in this MVP
      if (eventType === AnalyticsEventType.PAGE_VIEW) {
         // Potential optimization: use sendBeacon here for page unloads
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

    } catch (error) {
      console.error('Failed to send analytics event', error);
    }
  }, [endpoint, landingPageId, variantId, pathname]);

  // Track Page View
  useEffect(() => {
    sendEvent(AnalyticsEventType.PAGE_VIEW);
  }, [sendEvent]);

  // Track Clicks (for Heatmaps)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // We want to track coordinates relative to the document
      // and maybe the element selector if possible
      const target = e.target as HTMLElement;

      sendEvent(AnalyticsEventType.CLICK, {
        x: e.pageX,
        y: e.pageY,
        client_x: e.clientX,
        client_y: e.clientY,
        tag: target.tagName,
        id: target.id,
        class: target.className,
        text: target.innerText?.substring(0, 50) // Truncate
      });
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [sendEvent]);

  // Track Scroll Depth (throttled)
  useEffect(() => {
    let maxScroll = 0;
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Only send if significant change or milestone (25, 50, 75, 100)
        // For simplicity, just tracking max scroll on unmount or periodic?
        // Let's rely on unmount or a specific milestone logic for now to save requests
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
      // Send max scroll depth on unmount
      if (maxScroll > 0) {
          sendEvent(AnalyticsEventType.SCROLL, { depth_percentage: maxScroll });
      }
    };
  }, [sendEvent]);

  return null; // Invisible component
};
