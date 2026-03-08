import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { ReportIngestionService } from './reports/ingestion-service';
import { ReportIngestionRequest } from './reports/types';

// Create the Hono app for the reports ingestion API
const app = new Hono();

// Initialize the ingestion service
const ingestionService = new ReportIngestionService();

// POST /v1/reports/ingest - Main endpoint for report ingestion
app.post('/v1/reports/ingest', async (c) => {
  try {
    // Get the request body
    const contentType = c.req.header('Content-Type');

    if (!contentType) {
      return c.json({ error: 'Content-Type header is required' }, 400);
    }

    let requestBody: ReportIngestionRequest;

    if (contentType.includes('application/json')) {
      requestBody = await c.req.json();
    } else if (contentType.includes('text/markdown') || contentType.includes('text/plain')) {
      const reportText = await c.req.text();
      requestBody = {
        report: reportText,
        contentType: 'text/markdown',
        idempotencyKey: c.req.header('Idempotency-Key') || Date.now().toString(),
        projectNamespace: c.req.header('Project-Namespace') || 'default',
        apiKey: c.req.header('Authorization')?.replace('Bearer ', '') || ''
      };
    } else {
      return c.json({ error: 'Unsupported content type. Use application/json, text/markdown, or text/plain' }, 400);
    }

    // Extract API key from Authorization header if not in request body
    if (!requestBody.apiKey) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        requestBody.apiKey = authHeader.substring(7);
      } else if (authHeader) {
        requestBody.apiKey = authHeader;
      }
    }

    // Extract JWT from Authorization header if present
    if (!requestBody.jwt) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.includes('.')) { // Basic JWT check
        requestBody.jwt = authHeader;
      }
    }

    // Set defaults if not provided
    requestBody.idempotencyKey = requestBody.idempotencyKey || Date.now().toString();
    requestBody.projectNamespace = requestBody.projectNamespace || 'default';
    requestBody.contentType = contentType as 'application/json' | 'text/markdown';

    // Process the report ingestion
    const result = await ingestionService.processReportIngestion(requestBody);

    if (result.success) {
      return c.json(result, 200);
    } else {
      return c.json(result, 400);
    }
  } catch (error) {
    console.error('Error processing report ingestion:', error);
    return c.json({
      success: false,
      reportId: '',
      processedMetrics: [],
      message: 'Internal server error during report processing'
    }, 500);
  }
});

// GET /v1/reports/health - Health check endpoint
app.get('/v1/reports/health', (c) => {
  return c.json({ status: 'healthy', timestamp: Date.now() });
});

export default app;