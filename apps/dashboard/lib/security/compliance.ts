/**
 * Data Privacy Compliance (PDPA/GDPR)
 * Handle consent, data export, and deletion requests
 */

import { createClient } from '@supabase/supabase-js'
import { securityLogger } from './logger'
import Redis from 'ioredis'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 SECURE JOB QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

interface JobPayload {
  requestId: string
  jobToken: string
  userId?: string
  jobType: string
  queuedAt: string
  expiresAt: string
  [key: string]: unknown
}

interface SecureJob {
  id: string
  type: string
  payload: JobPayload
  jobToken: string
  userId?: string
  queuedAt: string
  expiresAt: string
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

class SecureJobQueue {
  private redis: Redis
  private jobSecret: string

  constructor() {
    this.jobSecret = process.env.JOB_SECRET || crypto.randomBytes(32).toString('hex')
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }

  generateJobToken(requestId: string, jobType: string): string {
    const payload = `${requestId}:${jobType}:${Date.now()}`
    return crypto.createHmac('sha256', this.jobSecret).update(payload).digest('hex')
  }

  verifyJobToken(token: string, requestId: string, jobType: string): boolean {
    const expectedToken = this.generateJobToken(requestId, jobType)
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
  }

  async enqueue(jobType: string, payload: JobPayload): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const job: SecureJob = {
      id: jobId,
      type: jobType,
      payload,
      jobToken: payload.jobToken,
      userId: payload.userId,
      queuedAt: payload.queuedAt,
      expiresAt: payload.expiresAt,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
    }

    // Store job in Redis with TTL
    await this.redis.setex(
      `job:${jobId}`,
      24 * 60 * 60, // 24 hours TTL
      JSON.stringify(job)
    )

    // Add to job queue
    await this.redis.lpush(`queue:${jobType}`, jobId)

    return jobId
  }

  async dequeue(jobType: string): Promise<SecureJob | null> {
    const jobId = await this.redis.brpoplpush(
      `queue:${jobType}`,
      `processing:${jobType}`,
      10 // 10 second timeout
    )

    if (!jobId) return null

    const jobData = await this.redis.get(`job:${jobId}`)
    if (!jobData) return null

    const job: SecureJob = JSON.parse(jobData)

    // Check if job has expired
    if (new Date(job.expiresAt) < new Date()) {
      await this.redis.del(`job:${jobId}`)
      return null
    }

    // Verify job token
    if (!this.verifyJobToken(job.jobToken, job.payload.requestId, job.type)) {
      await securityLogger.security('malicious_request', 'Invalid job token detected', { jobId })
      await this.redis.del(`job:${jobId}`)
      return null
    }

    // Update job status
    job.status = 'processing'
    job.attempts++

    await this.redis.setex(`job:${jobId}`, 24 * 60 * 60, JSON.stringify(job))

    return job
  }

  async completeJob(jobId: string, _result?: Record<string, unknown>): Promise<void> {
    const jobData = await this.redis.get(`job:${jobId}`)
    if (!jobData) return

    const job: SecureJob = JSON.parse(jobData)
    job.status = 'completed'

    await this.redis.setex(
      `job:${jobId}`,
      7 * 24 * 60 * 60, // Keep for 7 days for audit
      JSON.stringify(job)
    )

    // Remove from processing queue
    await this.redis.lrem(`processing:${job.type}`, 1, jobId)

    await securityLogger.security('admin_action', 'Background job completed', {
      jobId,
      jobType: job.type,
      userId: job.userId,
    })
  }

  async failJob(jobId: string, error: Error): Promise<void> {
    const jobData = await this.redis.get(`job:${jobId}`)
    if (!jobData) return

    const job: SecureJob = JSON.parse(jobData)

    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed'

      await securityLogger.error('Background job failed permanently', error, {
        jobId,
        jobType: job.type,
        userId: job.userId,
        attempts: job.attempts,
      })
    } else {
      // Requeue for retry
      await this.redis.lpush(`queue:${job.type}`, jobId)
    }

    // Remove from processing queue
    await this.redis.lrem(`processing:${job.type}`, 1, jobId)

    await this.redis.setex(`job:${jobId}`, 24 * 60 * 60, JSON.stringify(job))
  }

  async getJobStatus(jobId: string): Promise<SecureJob | null> {
    const jobData = await this.redis.get(`job:${jobId}`)
    return jobData ? JSON.parse(jobData) : null
  }

  async cleanupExpiredJobs(): Promise<number> {
    const patterns = ['job:*']
    let cleanedCount = 0

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern)

      for (const key of keys) {
        const jobData = await this.redis.get(key)
        if (jobData) {
          const job: SecureJob = JSON.parse(jobData)
          if (new Date(job.expiresAt) < new Date()) {
            await this.redis.del(key)
            cleanedCount++
          }
        }
      }
    }

    return cleanedCount
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ConsentType =
  | 'marketing'
  | 'analytics'
  | 'personalization'
  | 'third_party'
  | 'essential'

export interface UserConsent {
  userId: string
  consents: Record<ConsentType, boolean>
  updatedAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface DataExportRequest {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: Date
  completedAt?: Date
  downloadUrl?: string
  expiresAt?: Date
}

export interface DataDeletionRequest {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: Date
  completedAt?: Date
  tablesDeleted?: string[]
}

export type ComplianceRegulation = 'GDPR' | 'PDPA_TH' | 'PDPA_SG' | 'UU_PDP' | 'DPA_PH'

// ═══════════════════════════════════════════════════════════════════════════════
// 🌏 REGIONAL COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPLIANCE_RULES: Record<
  ComplianceRegulation,
  {
    name: string
    country: string[]
    dataRetentionDays: number
    requiresExplicitConsent: boolean
    rightToErasure: boolean
    rightToPortability: boolean
    breachNotificationHours: number
  }
> = {
  GDPR: {
    name: 'General Data Protection Regulation',
    country: ['EU', 'EEA'],
    dataRetentionDays: 365 * 3,
    requiresExplicitConsent: true,
    rightToErasure: true,
    rightToPortability: true,
    breachNotificationHours: 72,
  },
  PDPA_TH: {
    name: 'Personal Data Protection Act (Thailand)',
    country: ['TH'],
    dataRetentionDays: 365 * 5,
    requiresExplicitConsent: true,
    rightToErasure: true,
    rightToPortability: true,
    breachNotificationHours: 72,
  },
  PDPA_SG: {
    name: 'Personal Data Protection Act (Singapore)',
    country: ['SG'],
    dataRetentionDays: 365 * 5,
    requiresExplicitConsent: true,
    rightToErasure: false,
    rightToPortability: true,
    breachNotificationHours: 72,
  },
  UU_PDP: {
    name: 'Undang-Undang Perlindungan Data Pribadi (Indonesia)',
    country: ['ID'],
    dataRetentionDays: 365 * 5,
    requiresExplicitConsent: true,
    rightToErasure: true,
    rightToPortability: true,
    breachNotificationHours: 72,
  },
  DPA_PH: {
    name: 'Data Privacy Act (Philippines)',
    country: ['PH'],
    dataRetentionDays: 365 * 5,
    requiresExplicitConsent: true,
    rightToErasure: true,
    rightToPortability: true,
    breachNotificationHours: 72,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 COMPLIANCE SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class ComplianceService {
  private supabase
  private secureJobQueue: SecureJobQueue

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    )
    this.secureJobQueue = new SecureJobQueue()
  }

  private generateJobToken(requestId: string, jobType: string): string {
    return this.secureJobQueue.generateJobToken(requestId, jobType)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONSENT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getConsent(userId: string): Promise<UserConsent | null> {
    const { data } = await this.supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!data) return null

    return {
      userId: data.user_id,
      consents: data.consents,
      updatedAt: new Date(data.updated_at),
    }
  }

  async updateConsent(
    userId: string,
    consents: Partial<Record<ConsentType, boolean>>,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const existing = await this.getConsent(userId)

    const newConsents = {
      essential: true, // Always required
      ...existing?.consents,
      ...consents,
    }

    await this.supabase.from('user_consents').upsert({
      user_id: userId,
      consents: newConsents,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
      updated_at: new Date().toISOString(),
    })

    // Log consent change for audit
    await this.logConsentChange(userId, newConsents)
  }

  async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
    const consent = await this.getConsent(userId)
    return consent?.consents[type] ?? false
  }

  private async logConsentChange(userId: string, consents: Record<string, boolean>): Promise<void> {
    await this.supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'consent_update',
      resource_type: 'consent',
      details: { consents },
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA EXPORT (Right to Portability)
  // ─────────────────────────────────────────────────────────────────────────────

  async requestDataExport(userId: string): Promise<DataExportRequest> {
    const { data, error } = await this.supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create export request: ${error.message}`)

    // Queue background job for export
    await this.queueExportJob(data.id)

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      requestedAt: new Date(data.requested_at),
    }
  }

  async getExportStatus(requestId: string): Promise<DataExportRequest | null> {
    const { data } = await this.supabase
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      requestedAt: new Date(data.requested_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      downloadUrl: data.download_url,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    }
  }

  private async queueExportJob(requestId: string): Promise<void> {
    // Secure background job with authentication and authorization
    const jobToken = this.generateJobToken(requestId, 'data_export')

    try {
      await this.secureJobQueue.enqueue('data_export', {
        requestId,
        jobToken,
        userId: requestId, // Will be resolved in job processor
        jobType: 'data_export',
        queuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })

      await securityLogger.security('data_export', 'Data export job queued securely', {
        requestId,
        jobToken: jobToken.substring(0, 10) + '***',
      })
    } catch (error) {
      securityLogger.error('Failed to queue export job', error as Error, { requestId })
      throw new Error('Failed to queue export job')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA DELETION (Right to Erasure)
  // ─────────────────────────────────────────────────────────────────────────────

  async requestDataDeletion(userId: string): Promise<DataDeletionRequest> {
    const { data, error } = await this.supabase
      .from('data_deletion_requests')
      .insert({
        user_id: userId,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create deletion request: ${error.message}`)

    // Queue background job for deletion
    await this.queueDeletionJob(data.id)

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      requestedAt: new Date(data.requested_at),
    }
  }

  async getDeletionStatus(requestId: string): Promise<DataDeletionRequest | null> {
    const { data } = await this.supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      requestedAt: new Date(data.requested_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      tablesDeleted: data.tables_deleted,
    }
  }

  private async queueDeletionJob(requestId: string): Promise<void> {
    // Secure background job with authentication and authorization
    const jobToken = this.generateJobToken(requestId, 'data_deletion')

    try {
      await this.secureJobQueue.enqueue('data_deletion', {
        requestId,
        jobToken,
        userId: requestId, // Will be resolved in job processor
        jobType: 'data_deletion',
        queuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })

      await securityLogger.security('data_deletion', 'Data deletion job queued securely', {
        requestId,
        jobToken: jobToken.substring(0, 10) + '***',
      })
    } catch (error) {
      securityLogger.error('Failed to queue deletion job', error as Error, { requestId })
      throw new Error('Failed to queue deletion job')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA RETENTION
  // ─────────────────────────────────────────────────────────────────────────────

  async getApplicableRegulation(countryCode: string): Promise<ComplianceRegulation> {
    for (const [regulation, rules] of Object.entries(COMPLIANCE_RULES)) {
      if (rules.country.includes(countryCode)) {
        return regulation as ComplianceRegulation
      }
    }
    return 'GDPR' // Default to strictest
  }

  async cleanupExpiredData(regulation: ComplianceRegulation): Promise<number> {
    const rules = COMPLIANCE_RULES[regulation]
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - rules.dataRetentionDays)

    // Delete expired usage events
    const { count } = await this.supabase
      .from('usage_events')
      .delete()
      .lt('created_at', expiryDate.toISOString())

    return count || 0
  }
}

// Export singleton
export const complianceService = new ComplianceService()
