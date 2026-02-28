/**
 * @agencyos/vibe-compliance — RegTech & Compliance Facade SDK
 *
 * KYC/AML verification, SOC2/PCI-DSS audit automation, GDPR/CCPA compliance,
 * immutable audit trails, regulatory reporting engine.
 *
 * Usage:
 *   import { createKYCEngine, createAuditTrail, createComplianceChecker } from '@agencyos/vibe-compliance';
 *   const kyc = createKYCEngine({ provider: 'sumsub', region: 'EU' });
 *   const audit = createAuditTrail({ retention: 365 });
 *   const compliance = createComplianceChecker({ frameworks: ['soc2', 'gdpr'] });
 */

// ─── Types ──────────────────────────────────────────────────────

export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'review' | 'expired';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceFramework = 'soc2' | 'pci_dss' | 'gdpr' | 'ccpa' | 'hipaa' | 'iso27001' | 'sox';
export type AuditEventType = 'create' | 'read' | 'update' | 'delete' | 'login' | 'export' | 'approve' | 'reject';

export interface KYCVerification {
  id: string;
  userId: string;
  status: KYCStatus;
  riskScore: number;
  checks: KYCCheck[];
  submittedAt: string;
  reviewedAt?: string;
  expiresAt: string;
}

export interface KYCCheck {
  type: 'identity' | 'sanctions' | 'pep' | 'adverse_media' | 'document';
  status: 'passed' | 'failed' | 'pending' | 'manual_review';
  confidence: number;
  details?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: AuditEventType;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  title: string;
  status: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidence: string[];
  lastAuditedAt?: string;
}

export interface ComplianceReport {
  framework: ComplianceFramework;
  controls: ComplianceControl[];
  score: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  generatedAt: string;
}

// ─── KYC Engine ─────────────────────────────────────────────────

export interface KYCConfig {
  provider: string;
  region: 'EU' | 'US' | 'APAC' | 'GLOBAL';
  autoApproveThreshold?: number;
  expirationDays?: number;
}

export function createKYCEngine(config: KYCConfig) {
  const { autoApproveThreshold = 0.85, expirationDays = 365 } = config;

  return {
    /**
     * Danh gia risk score tu KYC checks
     */
    calculateRiskScore(checks: KYCCheck[]): { score: number; level: RiskLevel } {
      const weights: Record<KYCCheck['type'], number> = {
        identity: 0.3, sanctions: 0.3, pep: 0.2, adverse_media: 0.1, document: 0.1,
      };

      let score = 0;
      for (const check of checks) {
        const weight = weights[check.type] || 0.1;
        score += check.confidence * weight;
      }

      const level: RiskLevel = score >= 0.9 ? 'low' : score >= 0.7 ? 'medium' : score >= 0.5 ? 'high' : 'critical';
      return { score, level };
    },

    /**
     * Quyet dinh auto-approve hay manual review
     */
    determineAction(riskScore: number, checks: KYCCheck[]): { action: 'approve' | 'review' | 'reject'; reason: string } {
      const sanctionsFailed = checks.some(c => c.type === 'sanctions' && c.status === 'failed');
      if (sanctionsFailed) return { action: 'reject', reason: 'Sanctions check failed — automatic rejection' };

      if (riskScore >= autoApproveThreshold) return { action: 'approve', reason: 'Risk score above auto-approve threshold' };
      if (riskScore >= 0.5) return { action: 'review', reason: 'Moderate risk — manual review required' };
      return { action: 'reject', reason: 'Risk score below minimum threshold' };
    },

    /**
     * Tinh expiration date
     */
    calculateExpiration(approvedAt: Date): Date {
      const exp = new Date(approvedAt);
      exp.setDate(exp.getDate() + expirationDays);
      return exp;
    },

    /**
     * Kiem tra KYC da het han chua
     */
    isExpired(verification: KYCVerification): boolean {
      return new Date() > new Date(verification.expiresAt);
    },
  };
}

// ─── Audit Trail ────────────────────────────────────────────────

export interface AuditTrailConfig {
  retention: number;
  hashAlgorithm?: 'sha256' | 'sha512';
}

export function createAuditTrail(config: AuditTrailConfig) {
  const { retention } = config;

  return {
    /**
     * Tao audit event
     */
    createEvent(params: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
      return {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        ...params,
      };
    },

    /**
     * Kiem tra event co trong retention period khong
     */
    isWithinRetention(event: AuditEvent): boolean {
      const eventDate = new Date(event.timestamp);
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retention);
      return eventDate >= retentionDate;
    },

    /**
     * Loc events theo criteria
     */
    filterEvents(events: AuditEvent[], criteria: {
      actor?: string;
      eventType?: AuditEventType;
      resource?: string;
      startDate?: string;
      endDate?: string;
    }): AuditEvent[] {
      return events.filter(e => {
        if (criteria.actor && e.actor !== criteria.actor) return false;
        if (criteria.eventType && e.eventType !== criteria.eventType) return false;
        if (criteria.resource && e.resource !== criteria.resource) return false;
        if (criteria.startDate && e.timestamp < criteria.startDate) return false;
        if (criteria.endDate && e.timestamp > criteria.endDate) return false;
        return true;
      });
    },
  };
}

// ─── Compliance Checker ─────────────────────────────────────────

export interface ComplianceCheckerConfig {
  frameworks: ComplianceFramework[];
}

export function createComplianceChecker(_config: ComplianceCheckerConfig) {
  return {
    /**
     * Tinh compliance score cho 1 framework
     */
    calculateScore(controls: ComplianceControl[]): { score: number; status: ComplianceReport['status'] } {
      const implemented = controls.filter(c => c.status === 'implemented').length;
      const partial = controls.filter(c => c.status === 'partial').length;
      const applicable = controls.filter(c => c.status !== 'not_applicable').length;

      const score = applicable > 0 ? ((implemented + partial * 0.5) / applicable) * 100 : 0;
      const status: ComplianceReport['status'] = score >= 95 ? 'compliant' : score >= 70 ? 'partial' : 'non_compliant';

      return { score, status };
    },

    /**
     * Tao gap analysis — tim controls chua implement
     */
    generateGapAnalysis(controls: ComplianceControl[]): { gaps: ComplianceControl[]; priority: 'critical' | 'high' | 'medium' | 'low' } {
      const gaps = controls.filter(c => c.status === 'not_implemented' || c.status === 'partial');
      const gapRatio = gaps.length / controls.length;
      const priority = gapRatio > 0.3 ? 'critical' : gapRatio > 0.2 ? 'high' : gapRatio > 0.1 ? 'medium' : 'low';
      return { gaps, priority };
    },

    /**
     * Tao compliance report cho framework
     */
    generateReport(framework: ComplianceFramework, controls: ComplianceControl[]): ComplianceReport {
      const { score, status } = this.calculateScore(controls);
      return { framework, controls, score, status, generatedAt: new Date().toISOString() };
    },
  };
}
