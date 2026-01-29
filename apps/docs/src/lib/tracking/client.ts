import type { TrackingEvent } from './types';
import { apiPost } from '../api-client';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

/**
 * Client-side tracking utility for AgencyOS
 */
export const trackingClient = {
  /**
   * Track a generic event
   */
  async track(event: DistributiveOmit<TrackingEvent, 'timestamp' | 'url' | 'userAgent'>) {
    const fullEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // We use fire-and-forget for tracking to avoid blocking UI
    apiPost('/api/track', fullEvent).catch((err) => {
      console.error('Tracking failed:', err);
    });
  },

  /**
   * Track an experiment exposure
   */
  trackExposure(experimentId: string, variantId: string) {
    return this.track({
      type: 'exposure',
      experimentId,
      variantId,
    });
  },

  /**
   * Track a conversion goal
   */
  trackConversion(goalId: string, metadata?: Record<string, unknown>) {
    return this.track({
      type: 'conversion',
      goalId,
      metadata,
    });
  },

  /**
   * Track user engagement (e.g. time on page)
   */
  trackEngagement(metric: string, value: number) {
    return this.track({
      type: 'engagement',
      metric,
      value,
    });
  },

  /**
   * Track user feedback
   */
  trackFeedback(category: string, content: string, metadata?: Record<string, unknown>) {
    return this.track({
      type: 'feedback',
      category,
      content,
      metadata,
    });
  }
};
