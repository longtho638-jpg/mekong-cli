/**
 * 📊 VIBE Analytics - Growth Telemetry Engine
 *
 * Pattern 86: High-Fidelity Analytics Telemetry
 * Pattern 77: Annualized GMV Telemetry
 * Pattern 103: Universal Share & Growth Telemetry
 */

// ============================================
// SESSION MANAGEMENT
// ============================================

const SESSION_KEY = "vibe_session_id";

export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `vibe_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ============================================
// EVENT TYPES (Pattern 86)
// ============================================

export type VibeEvent =
  | { type: "page_view"; path: string; title: string }
  | {
      type: "agent_execute";
      agentName: string;
      duration: number;
      success: boolean;
    }
  | { type: "revenue_milestone"; amount: number; currency: string }
  | { type: "share"; platform: "copy" | "native" | "qr"; content: string }
  | { type: "conversion"; funnel: string; step: number }
  | { type: "error"; message: string; stack?: string };

export interface VibeEventPayload {
  event: VibeEvent;
  sessionId: string;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// TELEMETRY ENGINE
// ============================================

class VibeTelemetry {
  private queue: VibeEventPayload[] = [];
  private userId?: string;
  private flushInterval: number = 5000;
  private endpoint?: string;

  constructor() {
    if (typeof window !== "undefined") {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  setUser(userId: string): void {
    this.userId = userId;
  }

  setEndpoint(url: string): void {
    this.endpoint = url;
  }

  track(event: VibeEvent, metadata?: Record<string, unknown>): void {
    const payload: VibeEventPayload = {
      event,
      sessionId: getSessionId(),
      userId: this.userId,
      timestamp: Date.now(),
      metadata,
    };

    this.queue.push(payload);

    // Log in dev mode (browser-compatible check)
    if (
      typeof window !== "undefined" &&
      (window as unknown as { __DEV__?: boolean }).__DEV__
    ) {
      // eslint-disable-next-line no-console
      console.log("[VIBE]", event.type, payload);
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.endpoint) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      });
    } catch (err) {
      // Re-queue on failure
      this.queue.push(...batch);
    }
  }
}

export const vibeTelemetry = new VibeTelemetry();

// ============================================
// GROWTH METRICS (Pattern 77)
// ============================================

export interface GrowthMetrics {
  currentGMV: number;
  targetARR: number;
  growthRate: number;
  daysToTarget: number;
  annualizedRunRate: number;
}

export function calculateGrowthMetrics(
  currentGMV: number,
  targetARR: number = 1_000_000,
  monthlyGrowthRate: number = 0.1,
): GrowthMetrics {
  const annualizedRunRate = currentGMV * 12;
  const gap = targetARR - annualizedRunRate;

  // Calculate days to target using compound growth
  const monthsToTarget =
    gap > 0
      ? Math.log(targetARR / annualizedRunRate) /
        Math.log(1 + monthlyGrowthRate)
      : 0;

  return {
    currentGMV,
    targetARR,
    growthRate: monthlyGrowthRate,
    daysToTarget: Math.ceil(monthsToTarget * 30),
    annualizedRunRate,
  };
}

export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)} triệu`;
  }
  return amount.toLocaleString("vi-VN") + " đ";
}

// ============================================
// SHARE ENGINE (Pattern 103)
// ============================================

export async function shareContent(content: {
  title: string;
  text: string;
  url: string;
}): Promise<"native" | "copy"> {
  // Try native share first
  if (navigator.share) {
    try {
      await navigator.share(content);
      vibeTelemetry.track({
        type: "share",
        platform: "native",
        content: content.url,
      });
      return "native";
    } catch {
      // Fall through to clipboard
    }
  }

  // Fallback to clipboard
  await navigator.clipboard.writeText(`${content.title}\n${content.url}`);
  vibeTelemetry.track({
    type: "share",
    platform: "copy",
    content: content.url,
  });
  return "copy";
}

// ============================================
// WEB VITALS (Pattern 79)
// ============================================

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export async function collectWebVitals(): Promise<WebVitals> {
  const vitals: WebVitals = {};

  try {
    const entries = performance.getEntriesByType("paint");
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) vitals.fcp = fcp.startTime;

    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (nav) vitals.ttfb = nav.responseStart - nav.requestStart;
  } catch {
    // Browser may not support all metrics
  }

  return vitals;
}

// ============================================
// EXPORTS
// ============================================

export default {
  vibeTelemetry,
  calculateGrowthMetrics,
  formatVND,
  shareContent,
  collectWebVitals,
  getSessionId,
};
