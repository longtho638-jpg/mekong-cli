'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * 🏢 Asset Registry Hook
 *
 * Inspired by ERPNext Asset Management
 * Track digital assets, licenses, subscriptions
 */

export type AssetType = 'software' | 'license' | 'subscription' | 'hardware' | 'domain' | 'other'
export type AssetStatus = 'active' | 'expiring' | 'expired' | 'disposed'

export interface Asset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  vendor: string
  purchaseDate: string
  expiryDate?: string
  purchaseCost: number
  currentValue: number
  monthlyRecurring?: number
  assignedTo?: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface AssetSummary {
  totalAssets: number
  totalValue: number
  monthlyRecurring: number
  expiringThisMonth: number
  byType: Record<AssetType, number>
  byStatus: Record<AssetStatus, number>
}

interface UseAssetRegistryOptions {
  autoFetch?: boolean
  onError?: (error: Error) => void
}

export function useAssetRegistry(options: UseAssetRegistryOptions = {}) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const { autoFetch = true, onError } = options

  // Fetch all assets
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map database fields to camelCase
      const mapped = (data || []).map(
        (a: {
          id: string
          name: string
          type: AssetType
          status: AssetStatus
          vendor: string
          purchase_date: string
          expiry_date?: string
          purchase_cost: number
          current_value: number
          monthly_recurring?: number
          assigned_to?: string
          notes?: string
          tags?: string[]
          created_at: string
          updated_at: string
        }) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          vendor: a.vendor,
          purchaseDate: a.purchase_date,
          expiryDate: a.expiry_date,
          purchaseCost: a.purchase_cost,
          currentValue: a.current_value,
          monthlyRecurring: a.monthly_recurring,
          assignedTo: a.assigned_to,
          notes: a.notes,
          tags: a.tags || [],
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        })
      )

      setAssets(mapped)
    } catch {
      // Return demo data if table doesn't exist
      setAssets(getDemoAssets())
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAssets()
    }
  }, [autoFetch, fetchAssets])

  // Calculate summary
  const summary: AssetSummary = {
    totalAssets: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
    monthlyRecurring: assets.reduce((sum, a) => sum + (a.monthlyRecurring || 0), 0),
    expiringThisMonth: assets.filter(a => {
      if (!a.expiryDate) return false
      const expiry = new Date(a.expiryDate)
      const now = new Date()
      return expiry.getMonth() === now.getMonth() && expiry.getFullYear() === now.getFullYear()
    }).length,
    byType: assets.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1
        return acc
      },
      {} as Record<AssetType, number>
    ),
    byStatus: assets.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      },
      {} as Record<AssetStatus, number>
    ),
  }

  // Add asset
  const addAsset = useCallback(
    async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true)
      try {
        const supabase = createClient()
        const newAsset = {
          id: crypto.randomUUID(),
          ...asset,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('assets').insert(newAsset)
        if (error) throw error

        await fetchAssets()
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAssets, onError]
  )

  // Update asset
  const updateAsset = useCallback(
    async (id: string, updates: Partial<Asset>) => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('assets')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (error) throw error
        await fetchAssets()
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAssets, onError]
  )

  // Delete asset
  const deleteAsset = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { error } = await supabase.from('assets').delete().eq('id', id)
        if (error) throw error
        await fetchAssets()
      } catch (error) {
        onError?.(error as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAssets, onError]
  )

  // Filter helpers
  const getExpiringAssets = useCallback(
    (days: number = 30) => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + days)
      return assets.filter(a => {
        if (!a.expiryDate) return false
        const expiry = new Date(a.expiryDate)
        return expiry <= cutoff && expiry >= new Date()
      })
    },
    [assets]
  )

  const getAssetsByType = useCallback(
    (type: AssetType) => {
      return assets.filter(a => a.type === type)
    },
    [assets]
  )

  return {
    assets,
    summary,
    loading,
    fetchAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    getExpiringAssets,
    getAssetsByType,
  }
}

// Demo data for development
function getDemoAssets(): Asset[] {
  return [
    {
      id: '1',
      name: 'Figma Enterprise',
      type: 'subscription',
      status: 'active',
      vendor: 'Figma',
      purchaseDate: '2025-01-01',
      expiryDate: '2026-01-01',
      purchaseCost: 0,
      currentValue: 0,
      monthlyRecurring: 75,
      assignedTo: 'Design Team',
      notes: 'Enterprise plan with Dev Mode',
      tags: ['design', 'collaboration'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Vercel Pro',
      type: 'subscription',
      status: 'active',
      vendor: 'Vercel',
      purchaseDate: '2025-01-01',
      expiryDate: '2026-01-01',
      purchaseCost: 0,
      currentValue: 0,
      monthlyRecurring: 20,
      assignedTo: 'Dev Team',
      notes: 'Hosting for frontend apps',
      tags: ['hosting', 'dev'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'agencyos.network',
      type: 'domain',
      status: 'active',
      vendor: 'Cloudflare',
      purchaseDate: '2024-06-15',
      expiryDate: '2025-06-15',
      purchaseCost: 15,
      currentValue: 15,
      tags: ['domain', 'primary'],
      createdAt: '2024-06-15T00:00:00Z',
      updatedAt: '2024-06-15T00:00:00Z',
    },
    {
      id: '4',
      name: 'Adobe Creative Cloud',
      type: 'license',
      status: 'expiring',
      vendor: 'Adobe',
      purchaseDate: '2024-02-01',
      expiryDate: '2026-02-01',
      purchaseCost: 600,
      currentValue: 300,
      monthlyRecurring: 55,
      assignedTo: 'Creative Team',
      tags: ['design', 'video'],
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    },
  ]
}

export default useAssetRegistry
