/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
/**
 * Data Privacy Compliance (PDPA/GDPR)
 * Handle consent, data export, and deletion requests
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ConsentType =
    | 'marketing'
    | 'analytics'
    | 'personalization'
    | 'third_party'
    | 'essential';

export interface UserConsent {
    userId: string;
    consents: Record<ConsentType, boolean>;
    updatedAt: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface DataExportRequest {
    id: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
}

export interface DataDeletionRequest {
    id: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    completedAt?: Date;
    tablesDeleted?: string[];
}

export type ComplianceRegulation = 'GDPR' | 'PDPA_TH' | 'PDPA_SG' | 'UU_PDP' | 'DPA_PH';

// ═══════════════════════════════════════════════════════════════════════════════
// 🌏 REGIONAL COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPLIANCE_RULES: Record<ComplianceRegulation, {
    name: string;
    country: string[];
    dataRetentionDays: number;
    requiresExplicitConsent: boolean;
    rightToErasure: boolean;
    rightToPortability: boolean;
    breachNotificationHours: number;
}> = {
    GDPR: {
        name: 'General Data Protection Regulation',
        country: ['EU', 'EEA'],
        dataRetentionDays: 365 * 3,
        requiresExplicitConsent: true,
        rightToErasure: true,
        rightToPortability: true,
        breachNotificationHours: 72,
    },
    PDPA_TH: {
        name: 'Personal Data Protection Act (Thailand)',
        country: ['TH'],
        dataRetentionDays: 365 * 5,
        requiresExplicitConsent: true,
        rightToErasure: true,
        rightToPortability: true,
        breachNotificationHours: 72,
    },
    PDPA_SG: {
        name: 'Personal Data Protection Act (Singapore)',
        country: ['SG'],
        dataRetentionDays: 365 * 5,
        requiresExplicitConsent: true,
        rightToErasure: false,
        rightToPortability: true,
        breachNotificationHours: 72,
    },
    UU_PDP: {
        name: 'Undang-Undang Perlindungan Data Pribadi (Indonesia)',
        country: ['ID'],
        dataRetentionDays: 365 * 5,
        requiresExplicitConsent: true,
        rightToErasure: true,
        rightToPortability: true,
        breachNotificationHours: 72,
    },
    DPA_PH: {
        name: 'Data Privacy Act (Philippines)',
        country: ['PH'],
        dataRetentionDays: 365 * 5,
        requiresExplicitConsent: true,
        rightToErasure: true,
        rightToPortability: true,
        breachNotificationHours: 72,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 COMPLIANCE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class ComplianceService {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CONSENT MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────────

    async getConsent(userId: string): Promise<UserConsent | null> {
        const { data } = await this.supabase
            .from('user_consents')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!data) return null;

        return {
            userId: data.user_id,
            consents: data.consents,
            updatedAt: new Date(data.updated_at),
        };
    }

    async updateConsent(
        userId: string,
        consents: Partial<Record<ConsentType, boolean>>,
        metadata?: { ipAddress?: string; userAgent?: string }
    ): Promise<void> {
        const existing = await this.getConsent(userId);

        const newConsents = {
            essential: true, // Always required
            ...existing?.consents,
            ...consents,
        };

        await this.supabase.from('user_consents').upsert({
            user_id: userId,
            consents: newConsents,
            ip_address: metadata?.ipAddress,
            user_agent: metadata?.userAgent,
            updated_at: new Date().toISOString(),
        });

        // Log consent change for audit
        await this.logConsentChange(userId, newConsents);
    }

    async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
        const consent = await this.getConsent(userId);
        return consent?.consents[type] ?? false;
    }

    private async logConsentChange(userId: string, consents: Record<string, boolean>): Promise<void> {
        await this.supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'consent_update',
            resource_type: 'consent',
            details: { consents },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DATA EXPORT (Right to Portability)
    // ─────────────────────────────────────────────────────────────────────────────

    async requestDataExport(userId: string): Promise<DataExportRequest> {
        const { data, error } = await this.supabase
            .from('data_export_requests')
            .insert({
                user_id: userId,
                status: 'pending',
                requested_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create export request: ${error.message}`);

        // Queue background job for export
        await this.queueExportJob(data.id);

        return {
            id: data.id,
            userId: data.user_id,
            status: data.status,
            requestedAt: new Date(data.requested_at),
        };
    }

    async getExportStatus(requestId: string): Promise<DataExportRequest | null> {
        const { data } = await this.supabase
            .from('data_export_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!data) return null;

        return {
            id: data.id,
            userId: data.user_id,
            status: data.status,
            requestedAt: new Date(data.requested_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
            downloadUrl: data.download_url,
            expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        };
    }

    private async queueExportJob(requestId: string): Promise<void> {
        // In production, this would queue a background job
        // For now, we'll process inline (simplified)
        console.log(`Export job queued for request: ${requestId}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DATA DELETION (Right to Erasure)
    // ─────────────────────────────────────────────────────────────────────────────

    async requestDataDeletion(userId: string): Promise<DataDeletionRequest> {
        const { data, error } = await this.supabase
            .from('data_deletion_requests')
            .insert({
                user_id: userId,
                status: 'pending',
                requested_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create deletion request: ${error.message}`);

        // Queue background job for deletion
        await this.queueDeletionJob(data.id);

        return {
            id: data.id,
            userId: data.user_id,
            status: data.status,
            requestedAt: new Date(data.requested_at),
        };
    }

    async getDeletionStatus(requestId: string): Promise<DataDeletionRequest | null> {
        const { data } = await this.supabase
            .from('data_deletion_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!data) return null;

        return {
            id: data.id,
            userId: data.user_id,
            status: data.status,
            requestedAt: new Date(data.requested_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
            tablesDeleted: data.tables_deleted,
        };
    }

    private async queueDeletionJob(requestId: string): Promise<void> {
        console.log(`Deletion job queued for request: ${requestId}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DATA RETENTION
    // ─────────────────────────────────────────────────────────────────────────────

    async getApplicableRegulation(countryCode: string): Promise<ComplianceRegulation> {
        for (const [regulation, rules] of Object.entries(COMPLIANCE_RULES)) {
            if (rules.country.includes(countryCode)) {
                return regulation as ComplianceRegulation;
            }
        }
        return 'GDPR'; // Default to strictest
    }

    async cleanupExpiredData(regulation: ComplianceRegulation): Promise<number> {
        const rules = COMPLIANCE_RULES[regulation];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - rules.dataRetentionDays);

        // Delete expired usage events
        const { count } = await this.supabase
            .from('usage_events')
            .delete()
            .lt('created_at', expiryDate.toISOString());

        return count || 0;
    }
}

// Export singleton
export const complianceService = new ComplianceService();
