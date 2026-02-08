// Analytics client stub — replaced by @agencyos/vibe-analytics SDK when available

export const analytics = {
  track: (_event: { event: string; properties?: Record<string, unknown> }) => {
    if (typeof window === 'undefined') return;
    // Stub: no-op until SDK integration
  },
  page: (_data: { path?: string; url?: string; referrer?: string }) => {
    if (typeof window === 'undefined') return;
    // Stub: no-op until SDK integration
  },
  identify: (_data: { userId: string; traits?: Record<string, unknown> }) => {
    // Stub: no-op until SDK integration
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
