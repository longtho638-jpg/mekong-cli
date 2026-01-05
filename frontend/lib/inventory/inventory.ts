/**
 * Inventory & Asset Management Module for AgencyOS
 * ERPNext Parity: Asset Registry, Stock Ledger, License Tracking
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AssetType =
    | 'hardware'      // Physical equipment
    | 'software'      // Software licenses
    | 'subscription'  // SaaS subscriptions
    | 'digital'       // Digital assets (domains, etc.)
    | 'other';

export type AssetStatus =
    | 'active'
    | 'in_use'
    | 'maintenance'
    | 'retired'
    | 'disposed';

export interface Asset {
    id: string;
    tenantId: string;
    name: string;
    type: AssetType;
    category: string;
    code: string;
    serialNumber?: string;
    purchaseDate?: Date;
    purchasePrice?: number;
    currentValue?: number;
    depreciationRate?: number;
    vendor?: string;
    assignedTo?: string;
    status: AssetStatus;
    location?: string;
    notes?: string;
    expiryDate?: Date;
    renewalDate?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface AssetMovement {
    id: string;
    assetId: string;
    fromLocation?: string;
    toLocation?: string;
    fromAssignee?: string;
    toAssignee?: string;
    movementType: 'assignment' | 'transfer' | 'return' | 'maintenance' | 'disposal';
    date: Date;
    notes?: string;
    performedBy: string;
    createdAt: Date;
}

export interface LicenseInfo {
    id: string;
    tenantId: string;
    assetId?: string;
    name: string;
    vendor: string;
    licenseKey?: string;
    seats: number;
    usedSeats: number;
    purchaseDate: Date;
    expiryDate?: Date;
    cost: number;
    billingCycle: 'monthly' | 'yearly' | 'perpetual';
    status: 'active' | 'expired' | 'cancelled';
    createdAt: Date;
}

export interface AssetSummary {
    totalAssets: number;
    byType: Record<AssetType, number>;
    byStatus: Record<AssetStatus, number>;
    totalValue: number;
    expiringThisMonth: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ ASSET CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const ASSET_CATEGORIES = {
    hardware: [
        'Laptop',
        'Desktop',
        'Monitor',
        'Phone',
        'Tablet',
        'Server',
        'Networking Equipment',
        'Printer',
        'Camera',
        'Audio Equipment',
    ],
    software: [
        'Operating System',
        'Office Suite',
        'Design Software',
        'Development Tools',
        'Analytics Platform',
        'Security Software',
    ],
    subscription: [
        'Cloud Hosting',
        'SaaS Tool',
        'Marketing Platform',
        'Communication Tool',
        'Project Management',
        'CRM',
    ],
    digital: [
        'Domain Name',
        'SSL Certificate',
        'API Key',
        'Digital License',
    ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 INVENTORY SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class InventoryService {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ASSET CRUD
    // ─────────────────────────────────────────────────────────────────────────────

    async createAsset(tenantId: string, asset: Omit<Asset, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
        const code = await this.generateAssetCode(tenantId, asset.type);

        const { data, error } = await this.supabase
            .from('assets')
            .insert({
                tenant_id: tenantId,
                ...this.mapToDb(asset),
                code,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create asset: ${error.message}`);
        return this.mapFromDb(data);
    }

    async getAsset(tenantId: string, assetId: string): Promise<Asset | null> {
        const { data } = await this.supabase
            .from('assets')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', assetId)
            .single();

        return data ? this.mapFromDb(data) : null;
    }

    async listAssets(
        tenantId: string,
        filters?: {
            type?: AssetType;
            status?: AssetStatus;
            assignedTo?: string;
            expiringWithinDays?: number;
        }
    ): Promise<Asset[]> {
        let query = this.supabase
            .from('assets')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (filters?.type) query = query.eq('type', filters.type);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
        if (filters?.expiringWithinDays) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
            query = query.lte('expiry_date', futureDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw new Error(`Failed to list assets: ${error.message}`);
        return (data || []).map(this.mapFromDb);
    }

    async updateAsset(tenantId: string, assetId: string, updates: Partial<Asset>): Promise<Asset> {
        const { data, error } = await this.supabase
            .from('assets')
            .update(this.mapToDb(updates))
            .eq('tenant_id', tenantId)
            .eq('id', assetId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update asset: ${error.message}`);
        return this.mapFromDb(data);
    }

    async deleteAsset(tenantId: string, assetId: string): Promise<void> {
        const { error } = await this.supabase
            .from('assets')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('id', assetId);

        if (error) throw new Error(`Failed to delete asset: ${error.message}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ASSET MOVEMENTS
    // ─────────────────────────────────────────────────────────────────────────────

    async recordMovement(
        tenantId: string,
        assetId: string,
        movement: {
            movementType: AssetMovement['movementType'];
            toLocation?: string;
            toAssignee?: string;
            notes?: string;
        },
        performedBy: string
    ): Promise<AssetMovement> {
        // Get current asset state
        const asset = await this.getAsset(tenantId, assetId);
        if (!asset) throw new Error('Asset not found');

        // Record movement
        const { data, error } = await this.supabase
            .from('asset_movements')
            .insert({
                asset_id: assetId,
                from_location: asset.location,
                to_location: movement.toLocation,
                from_assignee: asset.assignedTo,
                to_assignee: movement.toAssignee,
                movement_type: movement.movementType,
                date: new Date().toISOString(),
                notes: movement.notes,
                performed_by: performedBy,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to record movement: ${error.message}`);

        // Update asset
        await this.updateAsset(tenantId, assetId, {
            location: movement.toLocation || asset.location,
            assignedTo: movement.toAssignee || asset.assignedTo,
        });

        return {
            id: data.id,
            assetId: data.asset_id,
            fromLocation: data.from_location,
            toLocation: data.to_location,
            fromAssignee: data.from_assignee,
            toAssignee: data.to_assignee,
            movementType: data.movement_type,
            date: new Date(data.date),
            notes: data.notes,
            performedBy: data.performed_by,
            createdAt: new Date(data.created_at),
        };
    }

    async getAssetHistory(tenantId: string, assetId: string): Promise<AssetMovement[]> {
        const { data, error } = await this.supabase
            .from('asset_movements')
            .select('*')
            .eq('asset_id', assetId)
            .order('date', { ascending: false });

        if (error) throw new Error(`Failed to get asset history: ${error.message}`);

        return (data || []).map(m => ({
            id: m.id,
            assetId: m.asset_id,
            fromLocation: m.from_location,
            toLocation: m.to_location,
            fromAssignee: m.from_assignee,
            toAssignee: m.to_assignee,
            movementType: m.movement_type,
            date: new Date(m.date),
            notes: m.notes,
            performedBy: m.performed_by,
            createdAt: new Date(m.created_at),
        }));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // LICENSES
    // ─────────────────────────────────────────────────────────────────────────────

    async createLicense(tenantId: string, license: Omit<LicenseInfo, 'id' | 'tenantId' | 'createdAt'>): Promise<LicenseInfo> {
        const { data, error } = await this.supabase
            .from('licenses')
            .insert({
                tenant_id: tenantId,
                asset_id: license.assetId,
                name: license.name,
                vendor: license.vendor,
                license_key: license.licenseKey,
                seats: license.seats,
                used_seats: license.usedSeats,
                purchase_date: license.purchaseDate.toISOString(),
                expiry_date: license.expiryDate?.toISOString(),
                cost: license.cost,
                billing_cycle: license.billingCycle,
                status: license.status,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create license: ${error.message}`);

        return {
            id: data.id,
            tenantId: data.tenant_id,
            assetId: data.asset_id,
            name: data.name,
            vendor: data.vendor,
            licenseKey: data.license_key,
            seats: data.seats,
            usedSeats: data.used_seats,
            purchaseDate: new Date(data.purchase_date),
            expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
            cost: data.cost,
            billingCycle: data.billing_cycle,
            status: data.status,
            createdAt: new Date(data.created_at),
        };
    }

    async listLicenses(tenantId: string): Promise<LicenseInfo[]> {
        const { data, error } = await this.supabase
            .from('licenses')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('expiry_date', { ascending: true });

        if (error) throw new Error(`Failed to list licenses: ${error.message}`);

        return (data || []).map(l => ({
            id: l.id,
            tenantId: l.tenant_id,
            assetId: l.asset_id,
            name: l.name,
            vendor: l.vendor,
            licenseKey: l.license_key,
            seats: l.seats,
            usedSeats: l.used_seats,
            purchaseDate: new Date(l.purchase_date),
            expiryDate: l.expiry_date ? new Date(l.expiry_date) : undefined,
            cost: l.cost,
            billingCycle: l.billing_cycle,
            status: l.status,
            createdAt: new Date(l.created_at),
        }));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // REPORTS
    // ─────────────────────────────────────────────────────────────────────────────

    async getAssetSummary(tenantId: string): Promise<AssetSummary> {
        const assets = await this.listAssets(tenantId);

        const byType: Record<AssetType, number> = {
            hardware: 0,
            software: 0,
            subscription: 0,
            digital: 0,
            other: 0,
        };

        const byStatus: Record<AssetStatus, number> = {
            active: 0,
            in_use: 0,
            maintenance: 0,
            retired: 0,
            disposed: 0,
        };

        let totalValue = 0;
        let expiringThisMonth = 0;
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);

        for (const asset of assets) {
            byType[asset.type]++;
            byStatus[asset.status]++;
            totalValue += asset.currentValue || asset.purchasePrice || 0;

            if (asset.expiryDate && asset.expiryDate <= endOfMonth) {
                expiringThisMonth++;
            }
        }

        return {
            totalAssets: assets.length,
            byType,
            byStatus,
            totalValue,
            expiringThisMonth,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private async generateAssetCode(tenantId: string, type: AssetType): Promise<string> {
        const prefix = type.toUpperCase().substring(0, 3);
        const { count } = await this.supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('type', type);

        return `${prefix}-${String((count || 0) + 1).padStart(5, '0')}`;
    }

    private mapToDb(asset: Partial<Asset>): Record<string, unknown> {
        return {
            name: asset.name,
            type: asset.type,
            category: asset.category,
            serial_number: asset.serialNumber,
            purchase_date: asset.purchaseDate?.toISOString(),
            purchase_price: asset.purchasePrice,
            current_value: asset.currentValue,
            depreciation_rate: asset.depreciationRate,
            vendor: asset.vendor,
            assigned_to: asset.assignedTo,
            status: asset.status,
            location: asset.location,
            notes: asset.notes,
            expiry_date: asset.expiryDate?.toISOString(),
            renewal_date: asset.renewalDate?.toISOString(),
            metadata: asset.metadata,
        };
    }

    private mapFromDb(data: any): Asset {
        return {
            id: data.id,
            tenantId: data.tenant_id,
            name: data.name,
            type: data.type,
            category: data.category,
            code: data.code,
            serialNumber: data.serial_number,
            purchaseDate: data.purchase_date ? new Date(data.purchase_date) : undefined,
            purchasePrice: data.purchase_price,
            currentValue: data.current_value,
            depreciationRate: data.depreciation_rate,
            vendor: data.vendor,
            assignedTo: data.assigned_to,
            status: data.status,
            location: data.location,
            notes: data.notes,
            expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
            renewalDate: data.renewal_date ? new Date(data.renewal_date) : undefined,
            metadata: data.metadata,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }
}

// Factory function for lazy initialization
export function getInventoryService() {
    return new InventoryService();
}
