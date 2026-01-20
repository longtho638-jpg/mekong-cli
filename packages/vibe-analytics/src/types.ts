/**
 * 📊 VIBE Analytics - Types
 */
export type VibeEvent =
  | { type: "page_view"; path: string; title: string }
  | { type: "agent_execute"; agentName: string; duration: number; success: boolean }
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

export interface GrowthMetrics {
  currentGMV: number;
  targetARR: number;
  growthRate: number;
  daysToTarget: number;
  annualizedRunRate: number;
}

export interface WebVitals {
  lcp?: number; fid?: number; cls?: number; fcp?: number; ttfb?: number;
}
