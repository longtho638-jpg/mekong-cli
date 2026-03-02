// Analytics client — console in dev, Vercel Analytics stub in production

const IS_DEV = process.env.NODE_ENV === 'development'

export const analytics = {
  track: (event: { event: string; properties?: Record<string, unknown> }) => {
    if (typeof window === 'undefined') return;
    if (IS_DEV) console.log('[analytics:track]', event.event, event.properties)
    // Vercel Analytics: window.va?.('event', { name: event.event, ...event.properties })
  },
  page: (data: { path?: string; url?: string; referrer?: string }) => {
    if (typeof window === 'undefined') return;
    if (IS_DEV) console.log('[analytics:page]', data.path)
  },
  identify: (data: { userId: string; traits?: Record<string, unknown> }) => {
    if (IS_DEV) console.log('[analytics:identify]', data.userId)
  },
};

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;

  analytics.track({
    event,
    properties: {
      ...properties,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackPageView = (path?: string) => {
  if (typeof window === 'undefined') return;

  analytics.page({
    path: path || window.location.pathname,
    url: window.location.href,
    referrer: document.referrer,
  });
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  analytics.identify({
    userId,
    traits,
  });
};
