/**
 * Bridge API Client - Real API integration for UnifiedBridge
 */

export interface BridgeStatus {
  gemini: boolean
  git: boolean
  antigravity: boolean
}

export interface RateLimitStatus {
  used: number
  max: number
  remaining: number
  resetIn: number
}

export interface UsageStats {
  gemini: number
  git: number
  antigravity: number
}

export interface BridgeData {
  status: BridgeStatus
  rateLimit: RateLimitStatus
  usage: UsageStats
}

/**
 * Fetch bridge status from backend
 */
export async function fetchBridgeStatus(): Promise<BridgeData> {
  try {
    const response = await fetch('/api/bridge/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    // Fallback to default values if API fails
    console.error('Failed to fetch bridge status:', error)
    return {
      status: { gemini: true, git: true, antigravity: true },
      rateLimit: { used: 0, max: 15, remaining: 15, resetIn: 60 },
      usage: { gemini: 0, git: 0, antigravity: 0 },
    }
  }
}

/**
 * Refresh bridge status (force reload)
 */
export async function refreshBridgeStatus(): Promise<BridgeData> {
  try {
    const response = await fetch('/api/bridge/status?refresh=true', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to refresh bridge status:', error)
    throw error
  }
}
