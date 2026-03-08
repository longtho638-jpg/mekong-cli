/**
 * Report Ingestion System for RaaS Analytics Dashboard
 *
 * Implements automated report ingestion from /plans/reports/ into the RaaS Analytics dashboard
 * Accepts signed uploads of markdown or JSON strategy reports
 * Validates mk_ API key and JWT
 * Parses key metrics (ROI, latency, error rate)
 * Stores in RaaS KV under project's namespace
 * Triggers webhook to update AgencyOS dashboard
 * Includes idempotency keys to prevent duplicate ingestion
 */

export interface ReportIngestionRequest {
  report: string; // Markdown or JSON content
  contentType: 'application/json' | 'text/markdown';
  idempotencyKey: string;
  projectNamespace: string;
  apiKey: string;
  jwt?: string;
}

export interface ReportMetrics {
  roi?: number;
  latency?: number;
  errorRate?: number;
  performanceScore?: number;
  timestamp: number;
  projectId: string;
}

export interface ReportIngestionResponse {
  success: boolean;
  reportId: string;
  processedMetrics: ReportMetrics[];
  message: string;
}

export interface WebhookPayload {
  eventType: 'REPORT_INGESTED';
  projectId: string;
  metrics: ReportMetrics;
  timestamp: number;
}