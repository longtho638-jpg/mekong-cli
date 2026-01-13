/**
 * 🟡 Mercury - VIBE Marketing
 * Content Factory & Growth Engine
 * 
 * Pattern 103: Universal Share & Growth Telemetry
 */

// ============================================
// TYPES
// ============================================

export type ContentType = 'blog' | 'social' | 'email' | 'video' | 'landing';
export type Channel = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'email' | 'sms';

export interface Content {
    id: string;
    type: ContentType;
    title: string;
    body: string;
    keywords: string[];
    channels: Channel[];
    publishDate?: Date;
    status: 'draft' | 'scheduled' | 'published';
}

export interface Campaign {
    id: string;
    name: string;
    contents: Content[];
    startDate: Date;
    endDate: Date;
    budget: number;
    kpis: CampaignKPIs;
}

export interface CampaignKPIs {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    roas: number;
}

export interface ReferralLink {
    code: string;
    ownerId: string;
    clicks: number;
    conversions: number;
    earnings: number;
}

// ============================================
// CONTENT FACTORY
// ============================================

export class ContentFactory {
    private contents: Map<string, Content> = new Map();

    create(content: Omit<Content, 'id' | 'status'>): Content {
        const newContent: Content = {
            ...content,
            id: `content_${Date.now()}`,
            status: 'draft',
        };
        this.contents.set(newContent.id, newContent);
        return newContent;
    }

    schedule(id: string, date: Date): Content | undefined {
        const content = this.contents.get(id);
        if (!content) return undefined;

        content.publishDate = date;
        content.status = 'scheduled';
        return content;
    }

    publish(id: string): Content | undefined {
        const content = this.contents.get(id);
        if (!content) return undefined;

        content.status = 'published';
        content.publishDate = new Date();
        return content;
    }

    getByType(type: ContentType): Content[] {
        return Array.from(this.contents.values())
            .filter(c => c.type === type);
    }
}

// ============================================
// REFERRAL ENGINE
// ============================================

export class ReferralEngine {
    private links: Map<string, ReferralLink> = new Map();

    generateLink(ownerId: string): ReferralLink {
        const code = `ref_${Math.random().toString(36).slice(2, 8)}`;
        const link: ReferralLink = {
            code,
            ownerId,
            clicks: 0,
            conversions: 0,
            earnings: 0,
        };
        this.links.set(code, link);
        return link;
    }

    trackClick(code: string): void {
        const link = this.links.get(code);
        if (link) link.clicks++;
    }

    trackConversion(code: string, value: number, commissionRate = 0.1): void {
        const link = this.links.get(code);
        if (link) {
            link.conversions++;
            link.earnings += value * commissionRate;
        }
    }

    getLeaderboard(limit = 10): ReferralLink[] {
        return Array.from(this.links.values())
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, limit);
    }
}

// ============================================
// EXPORTS
// ============================================

export const contentFactory = new ContentFactory();
export const referralEngine = new ReferralEngine();

export default { ContentFactory, ReferralEngine, contentFactory, referralEngine };
