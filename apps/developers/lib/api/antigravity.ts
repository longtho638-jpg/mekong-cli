 
/**
 * AntigravityKit API Client
 * Connects frontend to backend AntigravityKit modules
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ModuleStatus {
    name: string;
    icon: string;
    status: 'active' | 'pending' | 'error';
}

export interface AgencyDNA {
    name: string;
    niche: string;
    location: string;
    tone: string;
    tier: string;
    tagline: string;
    services: Array<{
        name: string;
        description: string;
        price: number;
    }>;
}

export interface ClientMagnetStats {
    total_leads: number;
    qualified_leads: number;
    hot_leads: number;
    total_clients: number;
    pipeline_value: number;
    pipeline_value_formatted: string;
    conversion_rate: number;
    timestamp: string;
}

export interface RevenueEngineStats {
    mrr: number;
    arr: number;
    mrr_formatted: string;
    arr_formatted: string;
    total_invoices: number;
    paid_invoices: number;
    total_revenue_usd: number;
    total_revenue_formatted: string;
    collection_rate: number;
    timestamp: string;
}

export interface ContentFactoryStats {
    total_ideas: number;
    total_content: number;
    avg_virality_score: number;
    timestamp: string;
}

export interface FranchiseStats {
    active_franchisees: number;
    total_territories: number;
    covered_territories: number;
    total_network_revenue: number;
    network_revenue_formatted: string;
    total_royalties_collected: number;
    royalties_formatted: string;
    territories: Array<{
        name: string;
        status: 'active' | 'available';
    }>;
    timestamp: string;
}

export interface VCMetrics {
    score: number;
    ltv_cac_ratio: number;
    rule_of_40: number;
    stage: string;
    mrr: number;
    arr: number;
    growth_rate: number;
    nrr: number;
    gross_margin: number;
    net_margin: number;
    cac: number;
    ltv: number;
    timestamp: string;
}

export interface DataMoatStats {
    data_points: number;
    unique_patterns: number;
    insights_generated: number;
    strength_score: number;
    defensibility: string;
    best_practices: string[];
    timestamp: string;
}

export interface AllModules {
    status: string;
    modules: ModuleStatus[];
    total_modules: number;
    timestamp: string;
}

class AntigravityAPI {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async fetchJSON<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async getAllModules(): Promise<AllModules> {
        return this.fetchJSON<AllModules>('/api/antigravity/modules');
    }

    async getAgencyDNA(): Promise<AgencyDNA> {
        return this.fetchJSON<AgencyDNA>('/api/antigravity/dna');
    }

    async getClientMagnetStats(): Promise<ClientMagnetStats> {
        return this.fetchJSON<ClientMagnetStats>('/api/antigravity/leads');
    }

    async getRevenueEngineStats(): Promise<RevenueEngineStats> {
        return this.fetchJSON<RevenueEngineStats>('/api/antigravity/revenue');
    }

    async getContentFactoryStats(): Promise<ContentFactoryStats> {
        return this.fetchJSON<ContentFactoryStats>('/api/antigravity/content');
    }

    async getFranchiseStats(): Promise<FranchiseStats> {
        return this.fetchJSON<FranchiseStats>('/api/antigravity/franchise');
    }

    async getVCMetrics(): Promise<VCMetrics> {
        return this.fetchJSON<VCMetrics>('/api/antigravity/vc');
    }

    async getDataMoatStats(): Promise<DataMoatStats> {
        return this.fetchJSON<DataMoatStats>('/api/antigravity/moat');
    }

    async resetDemoData(): Promise<{ status: string; message: string }> {
        const response = await fetch(`${this.baseURL}/api/antigravity/demo/reset`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}

// Export singleton instance
export const antigravityAPI = new AntigravityAPI();

// Export class for testing
export { AntigravityAPI };
