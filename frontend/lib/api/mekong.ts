'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// 🌊 MEKONG API CLIENT - Connect to FastAPI Backend
// Base URL: http://localhost:8000 (dev) | https://api.agencyos.network (prod)
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Agent {
    name: string;
    role: string;
    status: 'ready' | 'busy' | 'offline';
}

export interface AgentsResponse {
    quad_agents: Agent[];
    mekong_agents: Agent[];
    total: number;
}

export interface RouterStats {
    stats: Record<string, number>;
    strategy: {
        boss: string;
        worker: string;
    };
    target_savings: string;
}

export interface GuildStatus {
    member: string;
    tier: string;
    tier_emoji: string;
    status: string;
    trust_score: number;
    trust_max: number;
    score_breakdown: Record<string, number>;
    contributions: Record<string, number>;
    next_tier: {
        name: string;
        emoji: string;
        required: number;
        needed: number;
    };
}

export interface ClientDNA {
    client: string;
    status: string;
    trust_score: number;
    payment_history: string;
    reports: number;
    risk_level: string;
    recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAgents(): Promise<AgentsResponse> {
    return fetchAPI<AgentsResponse>('/api/agents');
}

export async function runAgent(agentName: string, task: string): Promise<{ status: string; job_id: string }> {
    return fetchAPI('/api/agents/run', {
        method: 'POST',
        body: JSON.stringify({ agent_name: agentName, task }),
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export async function getRouterStats(): Promise<RouterStats> {
    return fetchAPI<RouterStats>('/api/router/stats');
}

export async function routeTask(prompt: string): Promise<{
    provider: string;
    model: string;
    estimated_cost: number;
    reason: string;
}> {
    return fetchAPI('/api/router/route', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIBES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getVibes(): Promise<{ vibes: string[]; current: string }> {
    return fetchAPI('/api/vibes');
}

export async function setVibe(region: string): Promise<{ vibe: string; config: Record<string, unknown> }> {
    return fetchAPI('/api/vibes/set', {
        method: 'POST',
        body: JSON.stringify({ region }),
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUILD / DEFENSE
// ═══════════════════════════════════════════════════════════════════════════════

export async function getGuildStatus(): Promise<GuildStatus> {
    return fetchAPI<GuildStatus>('/api/guild/status');
}

export async function getGuildNetwork(): Promise<Record<string, unknown>> {
    return fetchAPI('/api/guild/network');
}

export async function checkClientDNA(clientName: string): Promise<ClientDNA> {
    return fetchAPI<ClientDNA>(`/api/defense/check/${encodeURIComponent(clientName)}`);
}

export async function getBlacklist(): Promise<{ total: number; clients: Array<{ name: string; risk: string; reason: string }> }> {
    return fetchAPI('/api/defense/blacklist');
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════════════════════════════════════════

export async function getPricingBenchmarks(): Promise<{
    avg_rate: number;
    rate_floor: number;
    your_rate: number;
    position: string;
    services: Array<{ name: string; floor: number; avg: number; top: number; your: number }>;
}> {
    return fetchAPI('/api/pricing/benchmarks');
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
    return fetchAPI('/');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14 VIETNAMESE COMMANDS (Mekong Commands)
// ═══════════════════════════════════════════════════════════════════════════════

export interface CommandResponse {
    success: boolean;
    command: string;
    result: string;
    execution_time: number;
    vibe?: string;
    binh_phap?: string;
}

// §1 Customer Profile
export async function cmdKhachHang(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/khach-hang', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §2 Business Plan
export async function cmdKeHoachKinhDoanh(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/ke-hoach-kinh-doanh', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §3 Market Research
export async function cmdNghienCuuThiTruong(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/nghien-cuu-thi-truong', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §4 Brand Identity
export async function cmdNhanDienThuongHieu(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/nhan-dien-thuong-hieu', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §5 Marketing Message
export async function cmdThongDiepTiepThi(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/thong-diep-tiep-thi', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §6 Marketing Plan
export async function cmdKeHoachTiepThi(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/ke-hoach-tiep-thi', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §7 Marketing Content
export async function cmdNoiDungTiepThi(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/noi-dung-tiep-thi', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §8 Social Media Ideas (50 ideas × 5 pillars)
export async function cmdYTuongSocialMedia(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/y-tuong-social-media', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §9 Sales Strategy
export async function cmdChienLuocBanHang(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/chien-luoc-ban-hang', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §10 PR Plan
export async function cmdKeHoachPR(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/ke-hoach-pr', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// §11 Growth Plan
export async function cmdKeHoachTangTruong(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/ke-hoach-tang-truong', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// Local Market - Agricultural prices
export async function cmdNongSan(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/nong-san', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// Sales Ops
export async function cmdBanHang(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/ban-hang', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// Marketing Ops
export async function cmdTiepThi(prompt: string): Promise<CommandResponse> {
    return fetchAPI('/api/commands/tiep-thi', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO & CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateVideoScript(topic: string, platform: string): Promise<{
    script: string;
    duration: string;
    sections: string[];
}> {
    return fetchAPI('/api/video/script', {
        method: 'POST',
        body: JSON.stringify({ topic, platform }),
    });
}

export async function generateSocialPost(topic: string, platform: string): Promise<{
    content: string;
    hashtags: string[];
}> {
    return fetchAPI('/api/content/social', {
        method: 'POST',
        body: JSON.stringify({ topic, platform }),
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    // Agents
    getAgents,
    runAgent,
    // Router
    getRouterStats,
    routeTask,
    // Vibes
    getVibes,
    setVibe,
    // Guild/Defense
    getGuildStatus,
    getGuildNetwork,
    checkClientDNA,
    getBlacklist,
    // Pricing
    getPricingBenchmarks,
    // Health
    healthCheck,
    // Commands
    cmdKhachHang,
    cmdKeHoachKinhDoanh,
    cmdNghienCuuThiTruong,
    cmdNhanDienThuongHieu,
    cmdThongDiepTiepThi,
    cmdKeHoachTiepThi,
    cmdNoiDungTiepThi,
    cmdYTuongSocialMedia,
    cmdChienLuocBanHang,
    cmdKeHoachPR,
    cmdKeHoachTangTruong,
    cmdNongSan,
    cmdBanHang,
    cmdTiepThi,
    // Video/Content
    generateVideoScript,
    generateSocialPost,
};
