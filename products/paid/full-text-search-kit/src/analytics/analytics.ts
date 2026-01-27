import { create } from 'zustand';

export interface SearchEvent {
  type: 'search' | 'click' | 'conversion';
  timestamp: number;
  data: any;
}

interface AnalyticsState {
  events: SearchEvent[];
  trackSearch: (query: string, resultsCount: number) => void;
  trackClick: (objectID: string, position: number) => void;
  trackConversion: (objectID: string) => void;
  getMetrics: () => { totalSearches: number; totalClicks: number; ctr: number };
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  events: [],

  trackSearch: (query: string, resultsCount: number) => {
    set((state) => ({
      events: [
        ...state.events,
        {
          type: 'search',
          timestamp: Date.now(),
          data: { query, resultsCount },
        },
      ],
    }));
    // In a real app, send this to your backend or Algolia Insights
    console.log('[Analytics] Search:', { query, resultsCount });
  },

  trackClick: (objectID: string, position: number) => {
    set((state) => ({
      events: [
        ...state.events,
        {
          type: 'click',
          timestamp: Date.now(),
          data: { objectID, position },
        },
      ],
    }));
    console.log('[Analytics] Click:', { objectID, position });
  },

  trackConversion: (objectID: string) => {
    set((state) => ({
      events: [
        ...state.events,
        {
          type: 'conversion',
          timestamp: Date.now(),
          data: { objectID },
        },
      ],
    }));
    console.log('[Analytics] Conversion:', { objectID });
  },

  getMetrics: () => {
    const { events } = get();
    const searches = events.filter((e) => e.type === 'search');
    const clicks = events.filter((e) => e.type === 'click');

    const totalSearches = searches.length;
    const totalClicks = clicks.length;
    const ctr = totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0;

    return {
      totalSearches,
      totalClicks,
      ctr,
    };
  },
}));
