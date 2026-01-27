import { ApiKeyResponse, ApiKeyCreate, WebhookConfigResponse, WebhookConfigCreate, ApiUsageStats } from './types/developer-types'

const API_BASE_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class DeveloperApi {
    private token: string | null = null

    setToken(token: string) {
        this.token = token
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            ...options.headers,
        }

        const response = await fetch(`${API_BASE_url}${path}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
            throw new Error(error.detail || `Request failed with status ${response.status}`)
        }

        return response.json()
    }

    // --- API Keys ---
    async listApiKeys(): Promise<ApiKeyResponse[]> {
        return this.request<ApiKeyResponse[]>('/developers/keys')
    }

    async createApiKey(data: ApiKeyCreate): Promise<ApiKeyResponse> {
        return this.request<ApiKeyResponse>('/developers/keys', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async revokeApiKey(keyId: string): Promise<void> {
        return this.request<void>(`/developers/keys/${keyId}`, {
            method: 'DELETE',
        })
    }

    async rotateApiKey(keyId: string): Promise<ApiKeyResponse> {
        return this.request<ApiKeyResponse>(`/developers/keys/${keyId}/rotate`, {
            method: 'POST',
        })
    }

    // --- Webhooks ---
    async listWebhooks(): Promise<WebhookConfigResponse[]> {
        return this.request<WebhookConfigResponse[]>('/developers/webhooks')
    }

    async createWebhook(data: WebhookConfigCreate, apiKeyId: string): Promise<WebhookConfigResponse> {
        // The backend expects api_key_id in the body alongside config data
        return this.request<WebhookConfigResponse>('/developers/webhooks', {
            method: 'POST',
            body: JSON.stringify({ ...data, api_key_id: apiKeyId }),
        })
    }

    async deleteWebhook(configId: string): Promise<void> {
        return this.request<void>(`/developers/webhooks/${configId}`, {
            method: 'DELETE',
        })
    }

    // --- Usage ---
    async getUsageStats(days: number = 30): Promise<ApiUsageStats> {
        return this.request<ApiUsageStats>(`/developers/usage/stats?days=${days}`)
    }
}

export const developerApi = new DeveloperApi()
