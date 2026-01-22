export type EventType = 'exposure' | 'conversion' | 'engagement' | 'feedback';

export interface BaseEvent {
  type: EventType;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  url: string;
  userAgent?: string;
  locale?: string;
}

export interface ExposureEvent extends BaseEvent {
  type: 'exposure';
  experimentId: string;
  variantId: string;
}

export interface ConversionEvent extends BaseEvent {
  type: 'conversion';
  experimentId?: string;
  variantId?: string;
  goalId: string; // e.g., 'signup', 'cta_click', 'docs_view'
  value?: number;
  metadata?: Record<string, any>;
}

export interface EngagementEvent extends BaseEvent {
  type: 'engagement';
  metric: string; // e.g., 'time_on_page', 'scroll_depth'
  value: number;
}

export interface FeedbackEvent extends BaseEvent {
  type: 'feedback';
  category: string; // e.g., 'bug', 'feature', 'general'
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

export type TrackingEvent = ExposureEvent | ConversionEvent | EngagementEvent | FeedbackEvent;
