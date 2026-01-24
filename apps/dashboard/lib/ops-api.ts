import { logger } from '@/lib/utils/logger'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_check: number;
  message?: string;
}

export interface ApprovalRequest {
  id: string;
  action_name: string;
  requester: string;
  payload: any;
  created_at: number;
  status: 'pending' | 'approved' | 'rejected';
}

export async function getOpsStatus(): Promise<ServiceHealth[]> {
  try {
    const response = await fetch(`${API_URL}/ops/status`)
    if (!response.ok) throw new Error('Failed to fetch ops status')
    return await response.json()
  } catch (error) {
    logger.error('Ops API error (status)', error)
    return []
  }
}

export async function getApprovals(): Promise<ApprovalRequest[]> {
  try {
    const response = await fetch(`${API_URL}/ops/approvals`)
    if (!response.ok) throw new Error('Failed to fetch approvals')
    return await response.json()
  } catch (error) {
    logger.error('Ops API error (approvals)', error)
    return []
  }
}

export async function approveRequest(requestId: string, approver: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/ops/approvals/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver })
    })
    return response.ok
  } catch (error) {
    logger.error('Ops API error (approve)', error)
    return false
  }
}

export async function rejectRequest(requestId: string, approver: string, reason?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/ops/approvals/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approver, reason })
    })
    return response.ok
  } catch (error) {
    logger.error('Ops API error (reject)', error)
    return false
  }
}
