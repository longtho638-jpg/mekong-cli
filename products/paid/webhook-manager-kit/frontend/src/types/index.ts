export interface WebhookEndpoint {
  id: number;
  url: string;
  description?: string;
  secret: string;
  is_active: boolean;
  event_types: string[];
  created_at: string;
}

export interface WebhookDelivery {
  id: number;
  endpoint_id: number;
  event_id?: number;
  url: string;
  request_headers: Record<string, any>;
  request_body: any;
  response_status_code?: number;
  response_body?: string;
  duration_ms?: number;
  success: boolean;
  attempt: number;
  error_message?: string;
  created_at: string;
  next_retry_at?: string;
}

export interface WebhookEndpointCreate {
  url: string;
  description?: string;
  event_types: string[];
  is_active?: boolean;
}
