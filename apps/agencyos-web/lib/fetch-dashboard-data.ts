/**
 * Barrel re-export — maintains backward-compat imports from '@/lib/fetch-dashboard-data'.
 * Each domain module is split into its own focused file (< 200 lines each).
 */
export { getMissions, getDashboardStats } from './fetch-dashboard-stats-and-missions'
export type { DashboardStats } from './fetch-dashboard-stats-and-missions'

export { getBillingData } from './fetch-billing-mcu-usage-data'
export type { BillingData, UsageRow } from './fetch-billing-mcu-usage-data'

export { getRevenueData } from './fetch-revenue-mission-cost-estimates'
export type { RevenueData, Transaction } from './fetch-revenue-mission-cost-estimates'

export { getAgentHealthStatus, getAgentCurrentTasks } from './fetch-agent-health-and-current-tasks'
export type { AgentHealth } from './fetch-agent-health-and-current-tasks'
