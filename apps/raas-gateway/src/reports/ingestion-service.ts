import { ReportIngestionRequest, ReportIngestionResponse } from './types';
import { ReportParsingService } from './parsing-service';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';
import { WebhookService } from './webhook-service';

/**
 * Main service for handling report ingestion
 */
export class ReportIngestionService {
  private storageService: StorageService;
  private webhookService: WebhookService;

  constructor(storageService?: StorageService, webhookService?: WebhookService) {
    this.storageService = storageService || new StorageService();
    this.webhookService = webhookService || new WebhookService();
  }

  /**
   * Process a report ingestion request
   */
  async processReportIngestion(request: ReportIngestionRequest): Promise<ReportIngestionResponse> {
    // Validate inputs
    if (!request.report || !request.contentType || !request.idempotencyKey || !request.projectNamespace || !request.apiKey) {
      return {
        success: false,
        reportId: '',
        processedMetrics: [],
        message: 'Missing required fields in request'
      };
    }

    // Validate API key and JWT
    const isAuthenticated = await AuthService.authenticateRequest(request.apiKey, request.jwt);
    if (!isAuthenticated) {
      return {
        success: false,
        reportId: '',
        processedMetrics: [],
        message: 'Authentication failed'
      };
    }

    // Check for idempotency to prevent duplicate processing
    const alreadyProcessed = await this.storageService.hasProcessedIdempotencyKey(
      request.projectNamespace,
      request.idempotencyKey
    );

    if (alreadyProcessed) {
      return {
        success: false,
        reportId: '',
        processedMetrics: [],
        message: 'Request already processed (idempotency key)'
      };
    }

    // Parse metrics from the report
    const metrics = ReportParsingService.parseMetrics(request.report, request.contentType);

    // Generate a unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the metrics in KV
    const stored = await this.storageService.storeMetrics(
      request.projectNamespace,
      reportId,
      metrics
    );

    if (!stored) {
      return {
        success: false,
        reportId: '',
        processedMetrics: [],
        message: 'Failed to store metrics in KV'
      };
    }

    // Store idempotency key to prevent duplicate processing
    const idempotencyStored = await this.storageService.storeIdempotencyKey(
      request.projectNamespace,
      request.idempotencyKey
    );

    if (!idempotencyStored) {
      console.warn('Failed to store idempotency key, but metrics were stored');
    }

    // Prepare webhook payload
    const webhookPayload = {
      eventType: 'REPORT_INGESTED' as const,
      projectId: request.projectNamespace,
      metrics: metrics,
      timestamp: Date.now()
    };

    // Trigger webhook to update AgencyOS dashboard
    const webhookTriggered = await this.webhookService.triggerDashboardUpdate(webhookPayload);

    if (!webhookTriggered) {
      console.warn('Failed to trigger dashboard update webhook');
    }

    return {
      success: true,
      reportId,
      processedMetrics: [metrics],
      message: 'Report ingested successfully'
    };
  }
}