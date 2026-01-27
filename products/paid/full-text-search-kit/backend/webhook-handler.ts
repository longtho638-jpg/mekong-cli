import { SearchClient } from '../src/core/search-client.js';

// Generic Webhook Handler Example (Framework Agnostic)
// Can be adapted for Next.js API Routes, Express, Fastify, etc.

export interface WebhookEvent {
  type: 'create' | 'update' | 'delete';
  indexName: string;
  document: any; // The data object
  documentId?: string; // Required for delete
}

export class SearchWebhookHandler {
  private client: SearchClient;

  constructor(client: SearchClient) {
    this.client = client;
  }

  async handleEvent(event: WebhookEvent) {
    console.log(`Processing webhook event: ${event.type} for index ${event.indexName}`);

    switch (event.type) {
      case 'create':
      case 'update':
        if (!event.document) {
          throw new Error('Document data required for create/update events');
        }
        // Add/Update is the same operation usually (upsert)
        await this.client.addDocuments(event.indexName, [event.document]);
        break;

      case 'delete':
        if (!event.documentId) {
          throw new Error('Document ID required for delete event');
        }
        await this.client.deleteDocuments(event.indexName, [event.documentId]);
        break;

      default:
        throw new Error(`Unknown event type: ${(event as any).type}`);
    }

    console.log('Webhook processed successfully');
  }
}

// Example usage with Next.js API Route:
/*
import { SearchClient } from 'full-text-search-kit';
import { SearchWebhookHandler } from 'full-text-search-kit/backend';

const client = new SearchClient({ ...config });
const handler = new SearchWebhookHandler(client);

export default async function apiHandler(req, res) {
  if (req.method === 'POST') {
    try {
      await handler.handleEvent(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
*/
