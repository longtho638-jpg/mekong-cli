import { ReportIngestionRequest, ReportMetrics, ReportIngestionResponse } from './types';

/**
 * Service for parsing key metrics from strategy reports
 */
export class ReportParsingService {
  /**
   * Parse metrics from markdown strategy reports
   */
  static parseMarkdownMetrics(report: string): ReportMetrics {
    const metrics: ReportMetrics = {
      timestamp: Date.now(),
      projectId: ''
    };

    // Extract metrics from markdown content
    const roiMatch = report.match(/ROI:\s*([0-9.]+)/i);
    if (roiMatch) {
      metrics.roi = parseFloat(roiMatch[1]);
    }

    const latencyMatch = report.match(/latency:\s*([0-9.]+)\s*(ms|s)/i);
    if (latencyMatch) {
      const value = parseFloat(latencyMatch[1]);
      const unit = latencyMatch[2];
      metrics.latency = unit === 's' ? value * 1000 : value; // Convert to ms
    }

    const errorRateMatch = report.match(/error\s*rate:\s*([0-9.]+)%/i);
    if (errorRateMatch) {
      metrics.errorRate = parseFloat(errorRateMatch[1]) / 100; // Convert to decimal
    }

    const performanceScoreMatch = report.match(/performance\s*score:\s*([0-9.]+)/i);
    if (performanceScoreMatch) {
      metrics.performanceScore = parseFloat(performanceScoreMatch[1]);
    }

    // Extract project ID from report
    const projectIdMatch = report.match(/project\s*id:\s*([a-zA-Z0-9-_]+)/i);
    if (projectIdMatch) {
      metrics.projectId = projectIdMatch[1];
    } else {
      // Generate a default project ID if not found
      metrics.projectId = 'default-' + Date.now().toString(36);
    }

    return metrics;
  }

  /**
   * Parse metrics from JSON strategy reports
   */
  static parseJsonMetrics(report: string): ReportMetrics {
    try {
      const parsed = JSON.parse(report);

      // Assuming standard structure for JSON reports
      return {
        roi: parsed.roi || parsed.ROI || parsed.metrics?.roi,
        latency: parsed.latency || parsed.metrics?.latency,
        errorRate: parsed.errorRate || parsed.metrics?.errorRate,
        performanceScore: parsed.performanceScore || parsed.metrics?.performanceScore,
        timestamp: parsed.timestamp || Date.now(),
        projectId: parsed.projectId || parsed.projectId || 'default-json-' + Date.now().toString(36)
      };
    } catch (error) {
      /* Error parsing JSON report */
      return {
        timestamp: Date.now(),
        projectId: 'parse-error-' + Date.now().toString(36)
      };
    }
  }

  /**
   * Parse metrics from any report format
   */
  static parseMetrics(report: string, contentType: string): ReportMetrics {
    if (contentType.includes('json')) {
      return this.parseJsonMetrics(report);
    } else {
      return this.parseMarkdownMetrics(report);
    }
  }
}