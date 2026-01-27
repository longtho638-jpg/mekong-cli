/**
 * Webhook Management API Client
 */

export interface WebhookEvent {
  id: string
  provider: string
  event_id: string
  event_type: string
  status: 'pending' | 'processed' | 'failed' | 'ignored'
  created_at: string
  processed_at?: string
  error_message?: string
  payload: any
}

export interface WebhookConfig {
  id: string
  url: string
  description?: string
  event_types: string[]
  is_active: boolean
  secret: string
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_config_id: string
  event_type: string
  status: 'pending' | 'success' | 'failed'
  response_status?: number
  attempt_count: number
  next_retry_at?: string
  created_at: string
}

const API_BASE = '/api/webhooks/manage'

/**
 * Fetch incoming webhook events
 */
export async function fetchWebhookEvents(
  provider?: string,
  status?: string,
  limit = 50
): Promise<WebhookEvent[]> {
  const params = new URLSearchParams()
  if (provider) params.append('provider', provider)
  if (status) params.append('status', status)
  params.append('limit', limit.toString())

  const res = await fetch(`${API_BASE}/events?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

/**
 * Replay a specific event
 */
export async function replayWebhookEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/replay`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to replay event')
}

/**
 * Fetch outgoing webhook configurations
 */
export async function fetchWebhookConfigs(): Promise<WebhookConfig[]> {
  const res = await fetch(`${API_BASE}/configs`)
  if (!res.ok) throw new Error('Failed to fetch configs')
  return res.json()
}

/**
 * Create a new outgoing webhook configuration
 */
export async function createWebhookConfig(
  data: Partial<WebhookConfig>
): Promise<WebhookConfig> {
  const res = await fetch(`${API_BASE}/configs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create config')
  return res.json()
}

/**
 * Update an existing outgoing webhook configuration
 */
export async function updateWebhookConfig(
  id: string,
  data: Partial<WebhookConfig>
): Promise<WebhookConfig> {
  const res = await fetch(`${API_BASE}/configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update config')
  return res.json()
}

/**
 * Delete a webhook configuration
 */
export async function deleteWebhookConfig(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/configs/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete config')
}

/**
 * Fetch outgoing deliveries logs
 */
export async function fetchWebhookDeliveries(
  configId?: string,
  status?: string,
  limit = 50
): Promise<WebhookDelivery[]> {
  const params = new URLSearchParams()
  if (configId) params.append('config_id', configId)
  if (status) params.append('status', status)
  params.append('limit', limit.toString())

  const res = await fetch(`${API_BASE}/deliveries?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch deliveries')
  return res.json()
}
