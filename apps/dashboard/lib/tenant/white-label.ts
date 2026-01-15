/**
 * White-Label Module
 * Custom branding that makes each tenant feel like their own product
 */

import { createClient } from '@supabase/supabase-js';
import { TenantSettings } from './isolation';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WhiteLabelConfig {
    // Basic Branding
    brandName: string;
    tagline?: string;
    logoUrl?: string;
    faviconUrl?: string;

    // Colors
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;

    // Typography
    fontFamily?: string;
    headingFont?: string;

    // Custom Domain
    customDomain?: string;
    domainVerified: boolean;
    sslEnabled: boolean;

    // Custom CSS
    customCss?: string;

    // Footer
    showPoweredBy: boolean;
    poweredByText?: string;

    // Login Page
    loginBackgroundUrl?: string;
    loginMessage?: string;

    // Email Templates
    emailFromName?: string;
    emailReplyTo?: string;
}

export interface DomainVerification {
    domain: string;
    txtRecord: string;
    cnameRecord: string;
    verified: boolean;
    verifiedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 WHITE-LABEL MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class WhiteLabelManager {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // BRANDING
    // ─────────────────────────────────────────────────────────────────────────────

    async getBrandingConfig(tenantId: string): Promise<WhiteLabelConfig> {
        const { data } = await this.supabase
            .from('tenant_branding')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (!data) {
            return this.getDefaultConfig();
        }

        return this.mapToConfig(data);
    }

    async updateBranding(tenantId: string, config: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
        const { data: existing } = await this.supabase
            .from('tenant_branding')
            .select('id')
            .eq('tenant_id', tenantId)
            .single();

        const brandingData = {
            tenant_id: tenantId,
            brand_name: config.brandName,
            tagline: config.tagline,
            logo_url: config.logoUrl,
            favicon_url: config.faviconUrl,
            primary_color: config.primaryColor,
            secondary_color: config.secondaryColor,
            accent_color: config.accentColor,
            background_color: config.backgroundColor,
            text_color: config.textColor,
            font_family: config.fontFamily,
            heading_font: config.headingFont,
            custom_css: config.customCss,
            show_powered_by: config.showPoweredBy,
            powered_by_text: config.poweredByText,
            login_background_url: config.loginBackgroundUrl,
            login_message: config.loginMessage,
            email_from_name: config.emailFromName,
            email_reply_to: config.emailReplyTo,
            updated_at: new Date().toISOString(),
        };

        if (existing) {
            const { data } = await this.supabase
                .from('tenant_branding')
                .update(brandingData)
                .eq('tenant_id', tenantId)
                .select()
                .single();
            return this.mapToConfig(data);
        } else {
            const { data } = await this.supabase
                .from('tenant_branding')
                .insert(brandingData)
                .select()
                .single();
            return this.mapToConfig(data);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CUSTOM DOMAIN
    // ─────────────────────────────────────────────────────────────────────────────

    async setupCustomDomain(tenantId: string, domain: string): Promise<DomainVerification> {
        // Generate verification records
        const txtRecord = `agencyos-verify=${tenantId.substring(0, 8)}`;
        const cnameRecord = `${tenantId.substring(0, 8)}.tenant.agencyos.network`;

        const { data } = await this.supabase
            .from('custom_domains')
            .insert({
                tenant_id: tenantId,
                domain: domain.toLowerCase(),
                txt_record: txtRecord,
                cname_record: cnameRecord,
                verified: false,
            })
            .select()
            .single();

        return {
            domain: data.domain,
            txtRecord: data.txt_record,
            cnameRecord: data.cname_record,
            verified: false,
        };
    }

    async verifyDomain(tenantId: string, domain: string): Promise<boolean> {
        // In production, this would actually check DNS records
        // For now, we simulate verification

        const { data: domainRecord } = await this.supabase
            .from('custom_domains')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('domain', domain)
            .single();

        if (!domainRecord) return false;

        // TODO: Implement actual DNS verification
        // const dnsVerified = await this.checkDnsRecords(domain, domainRecord.txt_record);

        // For demo, auto-verify after setup
        const verified = true;

        if (verified) {
            await this.supabase
                .from('custom_domains')
                .update({
                    verified: true,
                    verified_at: new Date().toISOString(),
                    ssl_enabled: true,
                })
                .eq('id', domainRecord.id);

            // Update tenant settings
            await this.supabase
                .from('tenant_branding')
                .update({
                    custom_domain: domain,
                    domain_verified: true,
                    ssl_enabled: true,
                })
                .eq('tenant_id', tenantId);
        }

        return verified;
    }

    async getCustomDomain(tenantId: string): Promise<DomainVerification | null> {
        const { data } = await this.supabase
            .from('custom_domains')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (!data) return null;

        return {
            domain: data.domain,
            txtRecord: data.txt_record,
            cnameRecord: data.cname_record,
            verified: data.verified,
            verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
        };
    }

    async removeDomain(tenantId: string): Promise<void> {
        await this.supabase
            .from('custom_domains')
            .delete()
            .eq('tenant_id', tenantId);

        await this.supabase
            .from('tenant_branding')
            .update({
                custom_domain: null,
                domain_verified: false,
                ssl_enabled: false,
            })
            .eq('tenant_id', tenantId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CSS GENERATION
    // ─────────────────────────────────────────────────────────────────────────────

    generateCssVariables(config: WhiteLabelConfig): string {
        return `
      :root {
        --brand-primary: ${config.primaryColor};
        --brand-secondary: ${config.secondaryColor};
        --brand-accent: ${config.accentColor};
        --brand-background: ${config.backgroundColor};
        --brand-text: ${config.textColor};
        ${config.fontFamily ? `--brand-font: ${config.fontFamily};` : ''}
        ${config.headingFont ? `--brand-heading-font: ${config.headingFont};` : ''}
      }
      
      ${config.customCss || ''}
    `.trim();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private getDefaultConfig(): WhiteLabelConfig {
        return {
            brandName: 'AgencyOS',
            primaryColor: '#6750A4',
            secondaryColor: '#625B71',
            accentColor: '#7D5260',
            backgroundColor: '#FEF7FF',
            textColor: '#1D1B20',
            domainVerified: false,
            sslEnabled: false,
            showPoweredBy: true,
            poweredByText: 'Powered by AgencyOS',
        };
    }

    private mapToConfig(data: any): WhiteLabelConfig {
        return {
            brandName: data.brand_name || 'AgencyOS',
            tagline: data.tagline,
            logoUrl: data.logo_url,
            faviconUrl: data.favicon_url,
            primaryColor: data.primary_color || '#6750A4',
            secondaryColor: data.secondary_color || '#625B71',
            accentColor: data.accent_color || '#7D5260',
            backgroundColor: data.background_color || '#FEF7FF',
            textColor: data.text_color || '#1D1B20',
            fontFamily: data.font_family,
            headingFont: data.heading_font,
            customDomain: data.custom_domain,
            domainVerified: data.domain_verified || false,
            sslEnabled: data.ssl_enabled || false,
            customCss: data.custom_css,
            showPoweredBy: data.show_powered_by ?? true,
            poweredByText: data.powered_by_text,
            loginBackgroundUrl: data.login_background_url,
            loginMessage: data.login_message,
            emailFromName: data.email_from_name,
            emailReplyTo: data.email_reply_to,
        };
    }
}

// Export singleton
export const whiteLabelManager = new WhiteLabelManager();
