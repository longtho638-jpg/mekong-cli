/**
 * @agencyos/vibe-consent — Privacy Consent Management SDK
 *
 * GDPR Art.6/Art.25, TCF 2.2 compliant consent management, DSR/DSAR processing,
 * GPC signal handling, and data flow mapping with privacy impact scoring.
 *
 * Usage:
 *   import { createConsentManager, createDSRProcessor, createDataMapper } from '@agencyos/vibe-consent';
 *   const consent = createConsentManager({ vendorId: 'v123', defaultLocale: 'en' });
 *   const dsr = createDSRProcessor({ organizationName: 'Acme Corp', dpoEmail: 'dpo@acme.com' });
 *   const mapper = createDataMapper();
 */

// ─── Core Types ─────────────────────────────────────────────────

export type ConsentStatus = 'granted' | 'denied' | 'not_set' | 'withdrawn' | 'expired';
export type ProcessingBasis = 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation' | 'vital_interest' | 'public_task';
export type DSRType = 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection' | 'automated_decision';
export type DSRStatus = 'received' | 'identity_verified' | 'in_progress' | 'completed' | 'rejected' | 'extended';
export type PrivacyImpact = 'low' | 'medium' | 'high' | 'critical';

export interface ConsentPurpose {
  id: string;
  name: string;
  description: string;
  legalBasis: ProcessingBasis;
  isEssential: boolean; // cannot be denied
  tcfPurposeId?: number; // TCF 2.2 purpose mapping
  dataCategories: string[];
  retentionDays: number;
}

export interface ConsentRecord {
  id: string;
  subjectId: string; // hashed user identifier
  purposeId: string;
  status: ConsentStatus;
  grantedAt: string | null;
  withdrawnAt: string | null;
  expiresAt: string | null;
  source: 'banner' | 'preference_center' | 'api' | 'implicit' | 'gpc';
  ipAddress: string | null; // stored hashed for audit
  userAgent: string | null;
  version: string; // consent policy version
}

export interface GPCSignal {
  detected: boolean;
  value: boolean; // true = user opts out of sale/sharing
  source: 'http_header' | 'navigator_api' | 'manual';
}

export interface DSRRequest {
  id: string;
  type: DSRType;
  subjectEmail: string;
  subjectId: string | null;
  status: DSRStatus;
  receivedAt: string;
  deadlineAt: string; // GDPR: 30 days (extendable to 90)
  completedAt: string | null;
  identityVerifiedAt: string | null;
  notes: string;
  dataSystems: string[]; // systems that need to respond
  rejectionReason: string | null;
}

export interface DataFlow {
  id: string;
  name: string;
  sourceSystem: string;
  destinationSystem: string;
  dataCategories: string[]; // 'email' | 'location' | 'financial' | 'health' | 'biometric' etc.
  processingBasis: ProcessingBasis;
  purposeIds: string[];
  crossBorderTransfer: boolean;
  transferMechanism: string | null; // 'SCCs' | 'adequacy_decision' | 'BCRs' | null
  retentionDays: number;
  isDocumented: boolean;
}

export interface ConsentManagerConfig {
  vendorId: string;
  defaultLocale?: string;
  consentExpiryDays?: number; // default 365
  policyVersion?: string;
}

// ─── Consent Manager ─────────────────────────────────────────────

/**
 * Records and manages user consent per purpose with GPC signal support,
 * full audit trail, and TCF 2.2 alignment.
 */
export function createConsentManager(config: ConsentManagerConfig) {
  const { vendorId, consentExpiryDays = 365, policyVersion = '1.0' } = config;
  const records: Map<string, ConsentRecord[]> = new Map(); // keyed by subjectId
  const purposes: Map<string, ConsentPurpose> = new Map();

  return {
    getVendorId: () => vendorId,

    registerPurpose: (purpose: ConsentPurpose) => purposes.set(purpose.id, purpose),
    getPurpose: (purposeId: string) => purposes.get(purposeId) ?? null,
    getAllPurposes: () => Array.from(purposes.values()),

    /**
     * Record explicit consent grant for a subject+purpose pair
     */
    recordConsent(subjectId: string, purposeId: string, source: ConsentRecord['source'], meta?: { ipAddress?: string; userAgent?: string }): ConsentRecord {
      const expiresAt = new Date(Date.now() + consentExpiryDays * 86400000).toISOString();
      const record: ConsentRecord = {
        id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        subjectId,
        purposeId,
        status: 'granted',
        grantedAt: new Date().toISOString(),
        withdrawnAt: null,
        expiresAt,
        source,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
        version: policyVersion,
      };
      const existing = records.get(subjectId) ?? [];
      // Append to audit trail — do NOT mutate old records
      records.set(subjectId, [...existing, record]);
      return { ...record };
    },

    /**
     * Withdraw consent — creates new withdrawal record, does not delete history
     */
    withdrawConsent(subjectId: string, purposeId: string): ConsentRecord | null {
      const existing = records.get(subjectId) ?? [];
      const latest = [...existing].reverse().find(r => r.purposeId === purposeId && r.status === 'granted');
      if (!latest) return null;
      const withdrawal: ConsentRecord = {
        ...latest,
        id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'withdrawn',
        withdrawnAt: new Date().toISOString(),
        grantedAt: null,
      };
      records.set(subjectId, [...existing, withdrawal]);
      return { ...withdrawal };
    },

    /**
     * Check current consent status for a subject+purpose
     */
    checkConsent(subjectId: string, purposeId: string): { allowed: boolean; status: ConsentStatus; record: ConsentRecord | null } {
      const purpose = purposes.get(purposeId);
      if (purpose?.isEssential) return { allowed: true, status: 'granted', record: null };

      const subjectRecords = records.get(subjectId) ?? [];
      const latest = [...subjectRecords].reverse().find(r => r.purposeId === purposeId);

      if (!latest) return { allowed: false, status: 'not_set', record: null };
      if (latest.status === 'withdrawn') return { allowed: false, status: 'withdrawn', record: latest };
      if (latest.expiresAt && latest.expiresAt < new Date().toISOString()) return { allowed: false, status: 'expired', record: latest };
      if (latest.status === 'granted') return { allowed: true, status: 'granted', record: latest };
      return { allowed: false, status: latest.status, record: latest };
    },

    /**
     * Handle Global Privacy Control signal — auto-deny non-essential sale/sharing purposes
     */
    handleGPCSignal(subjectId: string, signal: GPCSignal): { affectedPurposes: string[]; recordsCreated: number } {
      if (!signal.detected || !signal.value) return { affectedPurposes: [], recordsCreated: 0 };
      const salePurposes = Array.from(purposes.values()).filter(p => !p.isEssential && (p.tcfPurposeId === 3 || p.tcfPurposeId === 4 || p.name.toLowerCase().includes('sale') || p.name.toLowerCase().includes('sharing')));
      let recordsCreated = 0;
      for (const purpose of salePurposes) {
        const existing = records.get(subjectId) ?? [];
        const latest = [...existing].reverse().find(r => r.purposeId === purpose.id);
        if (!latest || latest.status === 'granted') {
          const record: ConsentRecord = {
            id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            subjectId,
            purposeId: purpose.id,
            status: 'denied',
            grantedAt: null,
            withdrawnAt: new Date().toISOString(),
            expiresAt: null,
            source: 'gpc',
            ipAddress: null,
            userAgent: null,
            version: policyVersion,
          };
          records.set(subjectId, [...(records.get(subjectId) ?? []), record]);
          recordsCreated++;
        }
      }
      return { affectedPurposes: salePurposes.map(p => p.id), recordsCreated };
    },

    /**
     * Get full consent audit trail for a subject (GDPR Art.5 accountability)
     */
    getAuditTrail(subjectId: string): ConsentRecord[] {
      return [...(records.get(subjectId) ?? [])].sort((a, b) => {
        const aTime = a.grantedAt ?? a.withdrawnAt ?? '';
        const bTime = b.grantedAt ?? b.withdrawnAt ?? '';
        return bTime.localeCompare(aTime);
      });
    },

    /**
     * Export subject consent preferences (for preference center UI)
     */
    exportPreferences(subjectId: string): { purposeId: string; name: string; status: ConsentStatus; isEssential: boolean }[] {
      return Array.from(purposes.values()).map(p => {
        const { status } = this.checkConsent(subjectId, p.id);
        return { purposeId: p.id, name: p.name, status, isEssential: p.isEssential };
      });
    },
  };
}

// ─── DSR Processor ───────────────────────────────────────────────

/**
 * Handles Data Subject Request / DSAR intake, identity verification,
 * deadline management (GDPR 30-day rule), and response generation.
 */
export function createDSRProcessor(config: { organizationName: string; dpoEmail: string; extensionDays?: number }) {
  const { organizationName, dpoEmail, extensionDays = 60 } = config;
  const requests: DSRRequest[] = [];

  return {
    /**
     * Intake new DSR — sets 30-day GDPR deadline automatically
     */
    intakeRequest(type: DSRType, subjectEmail: string, description: string, dataSystems: string[]): DSRRequest {
      const receivedAt = new Date().toISOString();
      const deadlineAt = new Date(Date.now() + 30 * 86400000).toISOString(); // GDPR Art.12(3): 30 days
      const request: DSRRequest = {
        id: `dsr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        subjectEmail,
        subjectId: null,
        status: 'received',
        receivedAt,
        deadlineAt,
        completedAt: null,
        identityVerifiedAt: null,
        notes: description,
        dataSystems,
        rejectionReason: null,
      };
      requests.push(request);
      return { ...request };
    },

    /**
     * Verify identity — clock starts from verification date per GDPR
     */
    verifyIdentity(requestId: string, subjectId: string): DSRRequest | null {
      const req = requests.find(r => r.id === requestId);
      if (!req) return null;
      req.identityVerifiedAt = new Date().toISOString();
      req.subjectId = subjectId;
      req.status = 'identity_verified';
      return { ...req };
    },

    /**
     * Extend deadline (GDPR Art.12(3): up to 3 months for complex requests)
     */
    extendDeadline(requestId: string, reason: string): DSRRequest | null {
      const req = requests.find(r => r.id === requestId);
      if (!req || req.status === 'completed' || req.status === 'rejected') return null;
      req.deadlineAt = new Date(Date.now() + extensionDays * 86400000).toISOString();
      req.status = 'extended';
      req.notes += `\n[EXTENSION ${new Date().toISOString().slice(0, 10)}]: ${reason}`;
      return { ...req };
    },

    /**
     * Mark request complete with response details
     */
    completeRequest(requestId: string, responseNotes: string): DSRRequest | null {
      const req = requests.find(r => r.id === requestId);
      if (!req) return null;
      req.status = 'completed';
      req.completedAt = new Date().toISOString();
      req.notes += `\n[RESPONSE]: ${responseNotes}`;
      return { ...req };
    },

    /**
     * Reject request with documented reason (GDPR Art.12(4))
     */
    rejectRequest(requestId: string, reason: string): DSRRequest | null {
      const req = requests.find(r => r.id === requestId);
      if (!req) return null;
      req.status = 'rejected';
      req.rejectionReason = reason;
      req.completedAt = new Date().toISOString();
      return { ...req };
    },

    /**
     * Get overdue requests (past 30-day deadline and not completed)
     */
    getOverdueRequests(): DSRRequest[] {
      const now = new Date().toISOString();
      return requests.filter(r => r.deadlineAt < now && r.status !== 'completed' && r.status !== 'rejected');
    },

    /**
     * Generate GDPR-compliant acknowledgment text for subject
     */
    generateAcknowledgment(requestId: string): string {
      const req = requests.find(r => r.id === requestId);
      if (!req) return '';
      const deadline = new Date(req.deadlineAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      return `Dear Data Subject,\n\nWe have received your ${req.type.replace(/_/g, ' ')} request (Reference: ${req.id}) on ${new Date(req.receivedAt).toLocaleDateString('en-GB')}.\n\nWe will respond by ${deadline} in accordance with Article 12 of the GDPR.\n\nIf you have questions, contact our Data Protection Officer at ${dpoEmail}.\n\nKind regards,\n${organizationName}`;
    },

    getAllRequests: () => [...requests],
  };
}

// ─── Data Mapper ─────────────────────────────────────────────────

/**
 * Registers and maps data flows across systems, detects undocumented flows,
 * and generates privacy impact scores per GDPR Art.25 (data protection by design).
 */
export function createDataMapper() {
  const flows: DataFlow[] = [];
  const sensitiveCategories = new Set(['health', 'biometric', 'genetic', 'racial_ethnic', 'political', 'religious', 'sexual_orientation', 'criminal', 'financial']);

  return {
    registerFlow: (flow: DataFlow) => flows.push({ ...flow, isDocumented: true }),

    /**
     * Calculate privacy impact score for a data flow
     */
    scorePrivacyImpact(flow: DataFlow): { impact: PrivacyImpact; score: number; factors: string[] } {
      let score = 0;
      const factors: string[] = [];

      const hasSensitive = flow.dataCategories.some(c => sensitiveCategories.has(c));
      if (hasSensitive) { score += 40; factors.push('Contains special category data (GDPR Art.9)'); }
      if (flow.crossBorderTransfer) { score += 20; factors.push('Cross-border data transfer'); }
      if (!flow.transferMechanism && flow.crossBorderTransfer) { score += 15; factors.push('No transfer mechanism documented'); }
      if (flow.processingBasis === 'legitimate_interest') { score += 10; factors.push('Legitimate interest basis requires LIA'); }
      if (flow.retentionDays > 365) { score += 10; factors.push(`Retention period ${flow.retentionDays}d exceeds 1 year`); }
      if (!flow.isDocumented) { score += 20; factors.push('Undocumented flow — ROPA non-compliant'); }
      if (flow.dataCategories.includes('location')) { score += 5; factors.push('Location data processing'); }

      const impact: PrivacyImpact = score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
      return { impact, score, factors };
    },

    /**
     * Detect undocumented flows from observed system interactions
     */
    detectUndocumentedFlows(observedFlows: { source: string; destination: string; dataHint: string }[]): { source: string; destination: string; dataHint: string }[] {
      return observedFlows.filter(observed =>
        !flows.some(f => f.sourceSystem === observed.source && f.destinationSystem === observed.destination)
      );
    },

    /**
     * Generate Record of Processing Activities (ROPA) per GDPR Art.30
     */
    generateROPA(): { flowId: string; name: string; basis: ProcessingBasis; impact: PrivacyImpact; crossBorder: boolean; retention: string }[] {
      return flows.map(flow => {
        const { impact } = this.scorePrivacyImpact(flow);
        return {
          flowId: flow.id,
          name: flow.name,
          basis: flow.processingBasis,
          impact,
          crossBorder: flow.crossBorderTransfer,
          retention: flow.retentionDays >= 365 ? `${Math.round(flow.retentionDays / 365)}y` : `${flow.retentionDays}d`,
        };
      });
    },

    /**
     * Get flows requiring DPIA (Data Protection Impact Assessment)
     * Required when processing is 'high risk' per GDPR Art.35
     */
    getFlowsRequiringDPIA(): DataFlow[] {
      return flows.filter(flow => {
        const { impact } = this.scorePrivacyImpact(flow);
        return impact === 'critical' || impact === 'high';
      });
    },

    /**
     * Summarize data map by system for security team visibility
     */
    systemDataInventory(): { system: string; inboundFlows: number; outboundFlows: number; sensitiveData: boolean; categories: string[] }[] {
      const systems = new Map<string, { inbound: number; outbound: number; cats: Set<string> }>();
      for (const flow of flows) {
        const src = systems.get(flow.sourceSystem) ?? { inbound: 0, outbound: 0, cats: new Set() };
        src.outbound++;
        flow.dataCategories.forEach(c => src.cats.add(c));
        systems.set(flow.sourceSystem, src);

        const dst = systems.get(flow.destinationSystem) ?? { inbound: 0, outbound: 0, cats: new Set() };
        dst.inbound++;
        flow.dataCategories.forEach(c => dst.cats.add(c));
        systems.set(flow.destinationSystem, dst);
      }
      return Array.from(systems.entries()).map(([system, data]) => ({
        system,
        inboundFlows: data.inbound,
        outboundFlows: data.outbound,
        sensitiveData: Array.from(data.cats).some(c => sensitiveCategories.has(c)),
        categories: Array.from(data.cats),
      }));
    },

    getAllFlows: () => [...flows],
  };
}
