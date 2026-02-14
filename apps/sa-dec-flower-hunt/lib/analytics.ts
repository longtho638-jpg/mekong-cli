"use client";

type EventName =
    | "page_view"
    | "button_click"
    | "product_view"
    | "add_to_cart"
    | "share_virtual_gift"
    | "scan_qr"
    | "read_blog"
    | "copilot_interaction"
    | "lead_capture"
    | "add_to_wishlist"
    | "purchase"
    | "live_terminal_view"
    | "live_terminal_share";

type EventProperties = Record<string, any>;

class AnalyticsService {
    private static instance: AnalyticsService;
    private userId: string | null = null;
    private isDev: boolean = process.env.NODE_ENV === "development";

    private constructor() { }

    public static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    public identify(userId: string) {
        this.userId = userId;
        this.log("Identify", { userId });
    }

    public track(name: EventName, properties: EventProperties = {}) {
        const eventData = {
            event: name,
            userId: this.userId,
            timestamp: new Date().toISOString(),
            ...properties,
        };

        this.log("Track", eventData);

        // TODO: Send to Supabase or External Analytics (GA4/Mixpanel)
        // this.sendToSupabase(eventData);
    }

    private log(action: string, data: any) {
        if (this.isDev) {
            console.log(`[Analytics] ${action}:`, data);
        }
    }
}

export const analytics = AnalyticsService.getInstance();

// Hook for easy usage
export const useAnalytics = () => {
    return {
        track: (name: EventName, props?: EventProperties) => analytics.track(name, props),
        identify: (id: string) => analytics.identify(id),
    };
};

export const trackEvent = (name: EventName, props?: EventProperties) => analytics.track(name, props);
