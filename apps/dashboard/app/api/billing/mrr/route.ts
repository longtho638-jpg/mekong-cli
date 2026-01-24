/**
 * Real-time MRR API Route
 * Fetches live MRR from unified subscriptions table (Stripe & PayPal)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════════════
// MRR CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

interface MRRMetrics {
  mrr: number
  arr: number
  activeSubscriptions: number
  newMRR: number
  churnedMRR: number
  netNewMRR: number
  averageRevenuePerUser: number
  breakdown: {
    plan: string
    count: number
    mrr: number
  }[]
  growth: {
    month: string
    mrr: number
  }[]
}

// Prices mapping for MRR calculation
const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  PRO: 49,
  ENTERPRISE: 199,
}

async function calculateMRR(): Promise<MRRMetrics> {
  const supabase = await createClient()

  // Get all active subscriptions from unified table
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')

  if (error) {
    throw new Error(`Failed to fetch subscriptions: ${error.message}`)
  }

  let totalMRR = 0
  const planBreakdown: Record<string, { count: number; mrr: number }> = {}

  for (const sub of (subscriptions || [])) {
    const monthlyAmount = PLAN_PRICES[sub.plan.toUpperCase()] || 0
    totalMRR += monthlyAmount

    const planName = sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1).toLowerCase()
    if (!planBreakdown[planName]) {
      planBreakdown[planName] = { count: 0, mrr: 0 }
    }
    planBreakdown[planName].count++
    planBreakdown[planName].mrr += monthlyAmount
  }

  // Get new subscriptions this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: newSubs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .gte('created_at', startOfMonth.toISOString())

  let newMRR = 0
  for (const sub of (newSubs || [])) {
    newMRR += PLAN_PRICES[sub.plan.toUpperCase()] || 0
  }

  // Get canceled subscriptions this month
  const { data: canceledSubs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'canceled')
    .gte('updated_at', startOfMonth.toISOString())

  let churnedMRR = 0
  for (const sub of (canceledSubs || [])) {
    churnedMRR += PLAN_PRICES[sub.plan.toUpperCase()] || 0
  }

  // Calculate growth (last 6 months - simplified)
  const growth: { month: string; mrr: number }[] = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()

  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    // Simulate growth (in production, query historical data)
    const simulatedMRR = totalMRR * (1 - i * 0.1)
    growth.push({
      month: months[monthIndex],
      mrr: Math.round(simulatedMRR * 100) / 100,
    })
  }

  return {
    mrr: Math.round(totalMRR * 100) / 100,
    arr: Math.round(totalMRR * 12 * 100) / 100,
    activeSubscriptions: (subscriptions || []).length,
    newMRR: Math.round(newMRR * 100) / 100,
    churnedMRR: Math.round(churnedMRR * 100) / 100,
    netNewMRR: Math.round((newMRR - churnedMRR) * 100) / 100,
    averageRevenuePerUser:
      (subscriptions || []).length > 0
        ? Math.round((totalMRR / (subscriptions || []).length) * 100) / 100
        : 0,
    breakdown: Object.entries(planBreakdown).map(([plan, data]) => ({
      plan,
      count: data.count,
      mrr: Math.round(data.mrr * 100) / 100,
    })),
    growth,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/billing/mrr
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(_request: NextRequest) {
  try {
    const metrics = await calculateMRR()

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('MRR API error', error)

    // Return mock data in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        data: {
          mrr: 12450.0,
          arr: 149400.0,
          activeSubscriptions: 127,
          newMRR: 2100.0,
          churnedMRR: 350.0,
          netNewMRR: 1750.0,
          averageRevenuePerUser: 98.03,
          breakdown: [
            { plan: 'Starter', count: 52, mrr: 2600 },
            { plan: 'Professional', count: 58, mrr: 5742 },
            { plan: 'Enterprise', count: 17, mrr: 4108 },
          ],
          growth: [
            { month: 'Aug', mrr: 8450 },
            { month: 'Sep', mrr: 9200 },
            { month: 'Oct', mrr: 10100 },
            { month: 'Nov', mrr: 11200 },
            { month: 'Dec', mrr: 11800 },
            { month: 'Jan', mrr: 12450 },
          ],
        },
        mock: true,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ error: 'Failed to calculate MRR' }, { status: 500 })
  }
}
