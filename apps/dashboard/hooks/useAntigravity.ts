 
import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import type {
  AllModules,
  AgencyDNA,
  ClientMagnetStats,
  RevenueEngineStats,
  ContentFactoryStats,
  FranchiseStats,
  VCMetrics,
  DataMoatStats,
} from '../lib/api/antigravity'
import { antigravityAPI } from '../lib/api/antigravity'

interface UseAntigravityReturn {
  modules: AllModules | null
  dna: AgencyDNA | null
  leads: ClientMagnetStats | null
  revenue: RevenueEngineStats | null
  content: ContentFactoryStats | null
  franchise: FranchiseStats | null
  vc: VCMetrics | null
  moat: DataMoatStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  resetDemo: () => Promise<void>
}

/**
 * React hook for AntigravityKit data
 * Auto-refreshes every 30 seconds
 */
export function useAntigravity(autoRefresh: boolean = true): UseAntigravityReturn {
  const [modules, setModules] = useState<AllModules | null>(null)
  const [dna, setDNA] = useState<AgencyDNA | null>(null)
  const [leads, setLeads] = useState<ClientMagnetStats | null>(null)
  const [revenue, setRevenue] = useState<RevenueEngineStats | null>(null)
  const [content, setContent] = useState<ContentFactoryStats | null>(null)
  const [franchise, setFranchise] = useState<FranchiseStats | null>(null)
  const [vc, setVC] = useState<VCMetrics | null>(null)
  const [moat, setMoat] = useState<DataMoatStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        modulesData,
        dnaData,
        leadsData,
        revenueData,
        contentData,
        franchiseData,
        vcData,
        moatData,
      ] = await Promise.all([
        antigravityAPI.getAllModules(),
        antigravityAPI.getAgencyDNA(),
        antigravityAPI.getClientMagnetStats(),
        antigravityAPI.getRevenueEngineStats(),
        antigravityAPI.getContentFactoryStats(),
        antigravityAPI.getFranchiseStats(),
        antigravityAPI.getVCMetrics(),
        antigravityAPI.getDataMoatStats(),
      ])

      setModules(modulesData)
      setDNA(dnaData)
      setLeads(leadsData)
      setRevenue(revenueData)
      setContent(contentData)
      setFranchise(franchiseData)
      setVC(vcData)
      setMoat(moatData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      logger.error('AntigravityKit API Error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const resetDemo = useCallback(async () => {
    try {
      setLoading(true)
      await antigravityAPI.resetDemoData()
      await fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset demo')
      logger.error('Reset Demo Error', err)
    } finally {
      setLoading(false)
    }
  }, [fetchAllData])

  // Initial fetch
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchAllData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchAllData])

  return {
    modules,
    dna,
    leads,
    revenue,
    content,
    franchise,
    vc,
    moat,
    loading,
    error,
    refresh: fetchAllData,
    resetDemo,
  }
}

/**
 * Hook for individual module data
 */
export function useModuleData<T>(fetcher: () => Promise<T>, refreshInterval: number = 30000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refresh: fetchData }
}
