export interface ApiKeyCreate {
    name: string;
    scopes: string[];
}

export interface ApiKeyResponse {
    id: string;
    user_id: string;
    name: string;
    prefix: string;
    scopes: string[];
    tier: string;
    status: 'active' | 'revoked' | 'expiring';
    created_at: string;
    expires_at?: string;
    last_used_at?: string;
    key?: string; // Only present on creation/rotation
}

export interface WebhookConfigCreate {
    url: string;
    events: string[];
}

export interface WebhookConfigResponse {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'disabled';
    created_at: string;
    updated_at: string;
    secret: string;
}

export interface ApiUsageStats {
    total_requests: number;
    requests_by_endpoint: Record<string, number>;
    requests_by_status: Record<string, number>;
    average_response_time_ms: number;
    chart_data: Array<{
        date: string;
        requests: number;
        errors: number;
    }>;
}
