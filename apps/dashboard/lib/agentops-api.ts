/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
// AgentOps API Service - Connect Frontend to AgentOps MVP
// Base URL: http://localhost:8000

import { logger } from '@/lib/utils/logger'

const AGENTOPS_API = 'http://localhost:8000'

export interface Win3Metrics {
  anh_win: {
    visibility: string
    portfolio_tracked: number
    deals_pipeline: number
    cash_flow: string
  }
  agency_win: {
    automation: string
    revenue: string
    agents_active: number
    hours_saved: string
  }
  startup_win: {
    protection: string
    term_sheets_reviewed: number
    bad_deals_blocked: number
    deals_sourced: number
  }
  overall: string
  target: string
  gap: string
}

export interface AgentSummary {
  agentops_version: string
  total_agents: number
  agent_clusters: {
    [key: string]: {
      agents: number
      status: string
      value: string
    }
  }
  win3_metrics: {
    anh_win: string
    agency_win: string
    startup_win: string
    overall: string
  }
  key_achievements: string[]
  binh_phap_applied: string[]
}

export interface Startup {
  id: string
  name: string
  mrr: number
  health_score: number
  runway: number
}

export interface Alert {
  source: string
  startup: string
  type: string
  severity: string
}

export interface Deal {
  id: string
  name: string
  stage: string
  binh_phap_score: number
  source: string
}

// Fetch WIN³ metrics
export async function getWin3Metrics(): Promise<Win3Metrics | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/metrics/win3`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Fetch full summary
export async function getSummary(): Promise<AgentSummary | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/summary`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Fetch portfolio
export async function getPortfolio(): Promise<{ total: number; startups: Startup[] } | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/portfolio`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Fetch alerts
export async function getAlerts(): Promise<{ total_alerts: number; alerts: Alert[] } | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/alerts`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Fetch deal pipeline
export async function getPipeline(): Promise<{ total_deals: number; deals: Deal[] } | null> {
  try {
    const response = await fetch(`${AGENTOPS_API}/dealflow/pipeline`)
    if (!response.ok) throw new Error('Failed to fetch')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Review term sheet
export async function reviewTermSheet(data: {
  valuation?: number
  investment?: number
  liquidation_preference?: number
  equity_percentage?: number
  anti_dilution?: string
  participation?: boolean
}): Promise<any> {
  try {
    const response = await fetch(`${AGENTOPS_API}/guardian/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to review')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

// Score startup with Binh Pháp
export async function scoreStartup(data: {
  name: string
  industry?: string
  stage?: string
  mrr?: number
  growth?: number
}): Promise<any> {
  try {
    const response = await fetch(`${AGENTOPS_API}/dealflow/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to score')
    return await response.json()
  } catch (error) {
    logger.error('AgentOps API error', error)
    return null
  }
}

export default {
  getWin3Metrics,
  getSummary,
  getPortfolio,
  getAlerts,
  getPipeline,
  reviewTermSheet,
  scoreStartup,
}
