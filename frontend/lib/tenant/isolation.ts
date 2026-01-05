/**
 * Tenant Isolation Module
 * Full RLS enforcement and data segregation
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    settings: TenantSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface TenantSettings {
    // Branding
    brandName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    accentColor?: string;

    // Custom Domain
    customDomain?: string;
    domainVerified?: boolean;

    // Features
    features: {
        whiteLabel: boolean;
        customDomain: boolean;
        apiAccess: boolean;
        sso: boolean;
        auditLog: boolean;
    };

    // Limits
    limits: {
        teamMembers: number;
        projects: number;
        storage: number; // GB
        apiCalls: number; // per month
    };
}

export interface TenantMember {
    id: string;
    tenantId: string;
    userId: string;
    email: string;
    name: string;
    role: TenantRole;
    status: 'active' | 'pending' | 'suspended';
    invitedBy: string;
    joinedAt?: Date;
    createdAt: Date;
}

export type TenantRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 TENANT MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TenantManager {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TENANT CRUD
    // ─────────────────────────────────────────────────────────────────────────────

    async createTenant(data: {
        name: string;
        ownerId: string;
        ownerEmail: string;
    }): Promise<Tenant> {
        const slug = this.generateSlug(data.name);

        // Create tenant
        const { data: tenant, error } = await this.supabase
            .from('tenants')
            .insert({
                name: data.name,
                slug,
                owner_id: data.ownerId,
                plan: 'FREE',
                settings: this.getDefaultSettings('FREE'),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create tenant: ${error.message}`);

        // Add owner as first member
        await this.addMember(tenant.id, {
            userId: data.ownerId,
            email: data.ownerEmail,
            name: 'Owner',
            role: 'owner',
        });

        return this.mapToTenant(tenant);
    }

    async getTenant(tenantId: string): Promise<Tenant | null> {
        const { data, error } = await this.supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (error || !data) return null;
        return this.mapToTenant(data);
    }

    async getTenantBySlug(slug: string): Promise<Tenant | null> {
        const { data, error } = await this.supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) return null;
        return this.mapToTenant(data);
    }

    async getTenantsByUser(userId: string): Promise<Tenant[]> {
        const { data: memberships } = await this.supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (!memberships?.length) return [];

        const tenantIds = memberships.map(m => m.tenant_id);

        const { data: tenants } = await this.supabase
            .from('tenants')
            .select('*')
            .in('id', tenantIds);

        return (tenants || []).map(this.mapToTenant);
    }

    async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
        const { data, error } = await this.supabase
            .from('tenants')
            .update({
                name: updates.name,
                settings: updates.settings,
                updated_at: new Date().toISOString(),
            })
            .eq('id', tenantId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update tenant: ${error.message}`);
        return this.mapToTenant(data);
    }

    async deleteTenant(tenantId: string): Promise<void> {
        // Soft delete - mark as deleted
        await this.supabase
            .from('tenants')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', tenantId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TEAM MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────────

    async getMembers(tenantId: string): Promise<TenantMember[]> {
        const { data } = await this.supabase
            .from('tenant_members')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: true });

        return (data || []).map(this.mapToMember);
    }

    async addMember(tenantId: string, member: {
        userId?: string;
        email: string;
        name: string;
        role: TenantRole;
    }): Promise<TenantMember> {
        const { data, error } = await this.supabase
            .from('tenant_members')
            .insert({
                tenant_id: tenantId,
                user_id: member.userId,
                email: member.email,
                name: member.name,
                role: member.role,
                status: member.userId ? 'active' : 'pending',
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to add member: ${error.message}`);
        return this.mapToMember(data);
    }

    async updateMemberRole(memberId: string, role: TenantRole): Promise<void> {
        await this.supabase
            .from('tenant_members')
            .update({ role })
            .eq('id', memberId);
    }

    async removeMember(memberId: string): Promise<void> {
        await this.supabase
            .from('tenant_members')
            .delete()
            .eq('id', memberId);
    }

    async inviteMember(tenantId: string, email: string, role: TenantRole, invitedBy: string): Promise<string> {
        // Check if member already exists
        const { data: existing } = await this.supabase
            .from('tenant_members')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('email', email)
            .single();

        if (existing) {
            throw new Error('User is already a member of this tenant');
        }

        // Create pending invitation
        const { data: member } = await this.supabase
            .from('tenant_members')
            .insert({
                tenant_id: tenantId,
                email,
                role,
                status: 'pending',
                invited_by: invitedBy,
            })
            .select()
            .single();

        // Generate invite token
        const token = this.generateInviteToken();

        await this.supabase
            .from('invitations')
            .insert({
                tenant_id: tenantId,
                member_id: member.id,
                email,
                token,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            });

        return token;
    }

    async acceptInvitation(token: string, userId: string): Promise<void> {
        const { data: invite } = await this.supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single();

        if (!invite) throw new Error('Invalid invitation');
        if (new Date(invite.expires_at) < new Date()) throw new Error('Invitation expired');

        // Activate membership
        await this.supabase
            .from('tenant_members')
            .update({
                user_id: userId,
                status: 'active',
                joined_at: new Date().toISOString(),
            })
            .eq('id', invite.member_id);

        // Delete invitation
        await this.supabase
            .from('invitations')
            .delete()
            .eq('id', invite.id);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ACCESS CONTROL
    // ─────────────────────────────────────────────────────────────────────────────

    async checkAccess(userId: string, tenantId: string, requiredRole?: TenantRole): Promise<boolean> {
        const { data: member } = await this.supabase
            .from('tenant_members')
            .select('role, status')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .single();

        if (!member || member.status !== 'active') return false;

        if (!requiredRole) return true;

        const roleHierarchy: Record<TenantRole, number> = {
            owner: 100,
            admin: 80,
            manager: 60,
            member: 40,
            viewer: 20,
        };

        return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
    }

    async getUserRole(userId: string, tenantId: string): Promise<TenantRole | null> {
        const { data } = await this.supabase
            .from('tenant_members')
            .select('role')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .single();

        return data?.role || null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') +
            '-' + Math.random().toString(36).substring(2, 8);
    }

    private generateInviteToken(): string {
        return crypto.randomUUID() + '-' + Date.now().toString(36);
    }

    private getDefaultSettings(plan: 'FREE' | 'PRO' | 'ENTERPRISE'): TenantSettings {
        const baseLimits = {
            FREE: { teamMembers: 3, projects: 5, storage: 1, apiCalls: 1000 },
            PRO: { teamMembers: 10, projects: -1, storage: 50, apiCalls: 50000 },
            ENTERPRISE: { teamMembers: -1, projects: -1, storage: 500, apiCalls: -1 },
        };

        return {
            features: {
                whiteLabel: plan === 'ENTERPRISE',
                customDomain: plan !== 'FREE',
                apiAccess: plan !== 'FREE',
                sso: plan === 'ENTERPRISE',
                auditLog: plan !== 'FREE',
            },
            limits: baseLimits[plan],
        };
    }

    private mapToTenant(data: any): Tenant {
        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            ownerId: data.owner_id,
            plan: data.plan,
            settings: data.settings,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }

    private mapToMember(data: any): TenantMember {
        return {
            id: data.id,
            tenantId: data.tenant_id,
            userId: data.user_id,
            email: data.email,
            name: data.name,
            role: data.role,
            status: data.status,
            invitedBy: data.invited_by,
            joinedAt: data.joined_at ? new Date(data.joined_at) : undefined,
            createdAt: new Date(data.created_at),
        };
    }
}

// Export singleton
export const tenantManager = new TenantManager();
