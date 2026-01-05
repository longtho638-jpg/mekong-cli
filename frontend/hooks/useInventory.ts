/**
 * React Hooks for Inventory Module
 * Wire UI to API endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import type { Asset, AssetSummary, LicenseInfo, AssetMovement } from '@/lib/inventory';

const API_BASE = '/api/inventory';

// ═══════════════════════════════════════════════════════════════════════════════
// useAssets
// ═══════════════════════════════════════════════════════════════════════════════

interface AssetFilters {
    type?: string;
    status?: string;
    assignedTo?: string;
    expiringWithinDays?: number;
}

export function useAssets(tenantId: string | null, filters?: AssetFilters) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssets = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            let url = `${API_BASE}?tenantId=${tenantId}&action=list`;
            if (filters?.type) url += `&type=${filters.type}`;
            if (filters?.status) url += `&status=${filters.status}`;
            if (filters?.assignedTo) url += `&assignedTo=${filters.assignedTo}`;
            if (filters?.expiringWithinDays) url += `&expiring=${filters.expiringWithinDays}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setAssets(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch assets');
        } finally {
            setLoading(false);
        }
    }, [tenantId, filters?.type, filters?.status, filters?.assignedTo, filters?.expiringWithinDays]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const createAsset = async (asset: Partial<Asset>) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'create', asset }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAssets();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to create asset' };
        }
    };

    const updateAsset = async (assetId: string, updates: Partial<Asset>) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'update', assetId, updates }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAssets();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to update asset' };
        }
    };

    const deleteAsset = async (assetId: string) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'delete', assetId }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAssets();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to delete asset' };
        }
    };

    return {
        assets,
        loading,
        error,
        refresh: fetchAssets,
        createAsset,
        updateAsset,
        deleteAsset,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useAssetSummary
// ═══════════════════════════════════════════════════════════════════════════════

export function useAssetSummary(tenantId: string | null) {
    const [summary, setSummary] = useState<AssetSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=summary`);
            const data = await res.json();

            if (data.success) {
                setSummary(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch asset summary');
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, loading, error, refresh: fetchSummary };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useAssetHistory
// ═══════════════════════════════════════════════════════════════════════════════

export function useAssetHistory(tenantId: string | null, assetId: string | null) {
    const [history, setHistory] = useState<AssetMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!tenantId || !assetId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=history&assetId=${assetId}`);
            const data = await res.json();

            if (data.success) {
                setHistory(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch asset history');
        } finally {
            setLoading(false);
        }
    }, [tenantId, assetId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const recordMovement = async (movement: {
        movementType: string;
        toLocation?: string;
        toAssignee?: string;
        notes?: string;
    }, userId: string) => {
        if (!tenantId || !assetId) return { success: false, error: 'Missing IDs' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'move', assetId, ...movement, userId }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchHistory();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to record movement' };
        }
    };

    return { history, loading, error, refresh: fetchHistory, recordMovement };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useLicenses
// ═══════════════════════════════════════════════════════════════════════════════

export function useLicenses(tenantId: string | null) {
    const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLicenses = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=licenses`);
            const data = await res.json();

            if (data.success) {
                setLicenses(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch licenses');
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchLicenses();
    }, [fetchLicenses]);

    const createLicense = async (license: Partial<LicenseInfo>) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'create-license', license }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchLicenses();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to create license' };
        }
    };

    return { licenses, loading, error, refresh: fetchLicenses, createLicense };
}
