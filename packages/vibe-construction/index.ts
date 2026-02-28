/**
 * @agencyos/vibe-construction — Construction Project Management SDK
 *
 * Manages construction project phases, permit workflows, subcontractor bids,
 * change orders, payment milestones, and lien waiver tracking.
 *
 * Usage:
 *   import { createProjectTracker, createPermitWorkflow, createSubcontractorManager } from '@agencyos/vibe-construction';
 *   const tracker = createProjectTracker({ projectId: 'proj_001', contractValue: 2500000 });
 *   const permits = createPermitWorkflow();
 *   const subs = createSubcontractorManager();
 */

// ─── Core Types ─────────────────────────────────────────────────

export type ConstructionPhase = 'preconstruction' | 'mobilization' | 'active' | 'substantial_completion' | 'closeout' | 'warranty';
export type PermitStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'issued' | 'expired' | 'rejected';
export type InspectionResult = 'pending' | 'passed' | 'failed' | 'partial' | 'waived';
export type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'voided';
export type LienWaiverType = 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';

export interface Milestone {
  id: string;
  name: string;
  phase: ConstructionPhase;
  plannedDate: string;
  actualDate: string | null;
  percentComplete: number;
  isCriticalPath: boolean;
}

export interface BudgetLine {
  category: string;
  budgeted: number;
  committed: number;
  invoiced: number;
  paid: number;
}

export interface Permit {
  id: string;
  type: string; // 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'grading'
  jurisdiction: string;
  applicationNumber: string | null;
  status: PermitStatus;
  submittedAt: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  fee: number;
}

export interface Inspection {
  id: string;
  permitId: string;
  type: string;
  scheduledDate: string;
  completedDate: string | null;
  result: InspectionResult;
  inspector: string | null;
  notes: string;
  failureItems: string[];
}

export interface ChangeOrder {
  id: string;
  number: string;
  description: string;
  requestedBy: 'owner' | 'contractor' | 'architect';
  status: ChangeOrderStatus;
  costImpact: number; // positive = increase, negative = credit
  scheduleImpact: number; // days
  submittedAt: string;
  approvedAt: string | null;
}

export interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  percentOfContract: number;
  triggerEvent: string; // e.g. "Foundation complete", "50% rough framing"
  dueDate: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  lienWaiverRequired: boolean;
  lienWaiverReceived: boolean;
}

export interface SubcontractorBid {
  id: string;
  trade: string; // 'electrical' | 'plumbing' | 'hvac' | 'drywall' | etc.
  company: string;
  contactEmail: string;
  bidAmount: number;
  scopeNotes: string;
  submittedAt: string;
  isSelected: boolean;
  bondRequired: boolean;
  insuranceCurrent: boolean;
}

export interface ProjectTrackerConfig {
  projectId: string;
  projectName?: string;
  contractValue: number;
  startDate: string;
  scheduledEndDate: string;
}

// ─── Project Tracker ─────────────────────────────────────────────

/**
 * Creates a construction project tracker with phase management,
 * budget variance analysis, and schedule delay detection.
 */
export function createProjectTracker(config: ProjectTrackerConfig) {
  const { projectId, contractValue, startDate, scheduledEndDate } = config;

  let currentPhase: ConstructionPhase = 'preconstruction';
  const milestones: Milestone[] = [];
  const budgetLines: BudgetLine[] = [];
  const changeOrders: ChangeOrder[] = [];

  return {
    getProjectId: () => projectId,

    /**
     * Advance project to next phase with validation
     */
    advancePhase(to: ConstructionPhase): { success: boolean; reason?: string } {
      const order: ConstructionPhase[] = ['preconstruction', 'mobilization', 'active', 'substantial_completion', 'closeout', 'warranty'];
      const currentIdx = order.indexOf(currentPhase);
      const targetIdx = order.indexOf(to);
      if (targetIdx !== currentIdx + 1) {
        return { success: false, reason: `Cannot skip phases. Must advance from ${currentPhase} sequentially.` };
      }
      currentPhase = to;
      return { success: true };
    },

    getCurrentPhase: () => currentPhase,

    /**
     * Add or update a project milestone
     */
    upsertMilestone(milestone: Milestone): void {
      const idx = milestones.findIndex(m => m.id === milestone.id);
      if (idx >= 0) milestones[idx] = milestone;
      else milestones.push(milestone);
    },

    /**
     * Calculate schedule variance in days (negative = behind schedule)
     */
    scheduleVariance(): { daysVariance: number; delayedMilestones: Milestone[] } {
      const today = new Date().toISOString().slice(0, 10);
      const delayed = milestones.filter(m => !m.actualDate && m.plannedDate < today);
      const totalPlannedDays = Math.round(
        (new Date(scheduledEndDate).getTime() - new Date(startDate).getTime()) / 86400000
      );
      const elapsed = Math.round((Date.now() - new Date(startDate).getTime()) / 86400000);
      const expectedProgress = Math.min(100, Math.round((elapsed / totalPlannedDays) * 100));
      const actualProgress = milestones.length > 0
        ? Math.round(milestones.reduce((s, m) => s + m.percentComplete, 0) / milestones.length)
        : 0;
      const daysVariance = Math.round(((actualProgress - expectedProgress) / 100) * totalPlannedDays);
      return { daysVariance, delayedMilestones: delayed };
    },

    /**
     * Calculate budget variance — includes approved change orders
     */
    budgetVariance(): { adjustedContract: number; totalCommitted: number; variance: number; burnPercent: number } {
      const approvedCOs = changeOrders
        .filter(co => co.status === 'approved')
        .reduce((sum, co) => sum + co.costImpact, 0);
      const adjustedContract = contractValue + approvedCOs;
      const totalCommitted = budgetLines.reduce((s, l) => s + l.committed, 0);
      const totalPaid = budgetLines.reduce((s, l) => s + l.paid, 0);
      return {
        adjustedContract,
        totalCommitted,
        variance: adjustedContract - totalCommitted,
        burnPercent: adjustedContract > 0 ? Math.round((totalPaid / adjustedContract) * 100) : 0,
      };
    },

    addBudgetLine: (line: BudgetLine) => budgetLines.push(line),
    addChangeOrder: (co: ChangeOrder) => changeOrders.push(co),

    getMilestones: () => [...milestones],
    getChangeOrders: () => [...changeOrders],

    /**
     * Summarize project health for dashboard
     */
    healthSummary(): { phase: ConstructionPhase; scheduleStatus: 'on_track' | 'at_risk' | 'delayed'; budgetStatus: 'on_budget' | 'over_budget'; completionForecast: string } {
      const { daysVariance } = this.scheduleVariance();
      const { variance } = this.budgetVariance();
      const scheduleStatus = daysVariance >= 0 ? 'on_track' : daysVariance >= -14 ? 'at_risk' : 'delayed';
      const budgetStatus = variance >= 0 ? 'on_budget' : 'over_budget';
      const forecastEnd = new Date(scheduledEndDate);
      forecastEnd.setDate(forecastEnd.getDate() - daysVariance);
      return { phase: currentPhase, scheduleStatus, budgetStatus, completionForecast: forecastEnd.toISOString().slice(0, 10) };
    },
  };
}

// ─── Permit Workflow ─────────────────────────────────────────────

/**
 * Manages permit submissions, status tracking, inspections, and compliance checklists.
 */
export function createPermitWorkflow() {
  const permits: Permit[] = [];
  const inspections: Inspection[] = [];

  return {
    addPermit: (permit: Permit) => permits.push(permit),

    /**
     * Update permit status with timestamp side-effects
     */
    updatePermitStatus(permitId: string, status: PermitStatus): Permit | null {
      const permit = permits.find(p => p.id === permitId);
      if (!permit) return null;
      permit.status = status;
      if (status === 'submitted') permit.submittedAt = new Date().toISOString();
      if (status === 'issued') permit.issuedAt = new Date().toISOString();
      return { ...permit };
    },

    scheduleInspection: (inspection: Inspection) => inspections.push(inspection),

    /**
     * Record inspection result and return re-inspection requirement
     */
    recordInspectionResult(inspectionId: string, result: InspectionResult, failureItems: string[], notes: string): { requiresReinspection: boolean; inspection: Inspection | null } {
      const insp = inspections.find(i => i.id === inspectionId);
      if (!insp) return { requiresReinspection: false, inspection: null };
      insp.result = result;
      insp.completedDate = new Date().toISOString();
      insp.failureItems = failureItems;
      insp.notes = notes;
      return { requiresReinspection: result === 'failed' || result === 'partial', inspection: { ...insp } };
    },

    /**
     * Generate compliance checklist for a permit type
     */
    complianceChecklist(permitType: string): { item: string; required: boolean }[] {
      const base = [
        { item: 'Signed permit application', required: true },
        { item: 'Site plan / plot plan', required: true },
        { item: 'Proof of property ownership or authorization', required: true },
        { item: 'Contractor license verification', required: true },
        { item: 'General liability insurance certificate', required: true },
        { item: "Workers' compensation certificate", required: true },
      ];
      const byType: Record<string, { item: string; required: boolean }[]> = {
        building: [
          { item: 'Architectural drawings (stamped)', required: true },
          { item: 'Structural engineering calculations', required: true },
          { item: 'Energy compliance documentation (IECC)', required: true },
        ],
        electrical: [
          { item: 'Electrical single-line diagram', required: true },
          { item: 'Load calculations', required: true },
          { item: 'Panel schedule', required: false },
        ],
        plumbing: [
          { item: 'Plumbing riser diagram', required: true },
          { item: 'Fixture unit count', required: false },
        ],
        grading: [
          { item: 'Grading plan (stamped civil engineer)', required: true },
          { item: 'SWPPP (Storm Water Pollution Prevention Plan)', required: true },
          { item: 'Soils report', required: false },
        ],
      };
      return [...base, ...(byType[permitType] ?? [])];
    },

    getExpiredPermits(): Permit[] {
      const today = new Date().toISOString().slice(0, 10);
      return permits.filter(p => p.expiresAt && p.expiresAt < today && p.status === 'issued');
    },

    getPendingInspections(): Inspection[] {
      return inspections.filter(i => i.result === 'pending');
    },
  };
}

// ─── Subcontractor Manager ───────────────────────────────────────

/**
 * Manages subcontractor bid leveling, change orders, payment milestones, and lien waivers.
 */
export function createSubcontractorManager() {
  const bids: SubcontractorBid[] = [];
  const paymentMilestones: PaymentMilestone[] = [];

  return {
    submitBid: (bid: SubcontractorBid) => bids.push(bid),

    /**
     * Level bids by trade — return ranked list with variance from low bid
     */
    levelBids(trade: string): { bid: SubcontractorBid; variance: number; variancePercent: number }[] {
      const tradeBids = bids.filter(b => b.trade === trade).sort((a, b) => a.bidAmount - b.bidAmount);
      if (tradeBids.length === 0) return [];
      const lowBid = tradeBids[0].bidAmount;
      return tradeBids.map(bid => ({
        bid,
        variance: bid.bidAmount - lowBid,
        variancePercent: lowBid > 0 ? Math.round(((bid.bidAmount - lowBid) / lowBid) * 100) : 0,
      }));
    },

    /**
     * Award bid — marks selected, rejects others in same trade
     */
    awardBid(bidId: string): { awarded: SubcontractorBid | null; rejected: SubcontractorBid[] } {
      const awarded = bids.find(b => b.id === bidId);
      if (!awarded) return { awarded: null, rejected: [] };
      awarded.isSelected = true;
      const rejected = bids.filter(b => b.trade === awarded.trade && b.id !== bidId);
      rejected.forEach(b => { b.isSelected = false; });
      return { awarded: { ...awarded }, rejected: rejected.map(b => ({ ...b })) };
    },

    addPaymentMilestone: (milestone: PaymentMilestone) => paymentMilestones.push(milestone),

    /**
     * Process payment milestone — validate lien waiver receipt before marking paid
     */
    processMilestonePayment(milestoneId: string): { success: boolean; reason?: string; milestone?: PaymentMilestone } {
      const ms = paymentMilestones.find(m => m.id === milestoneId);
      if (!ms) return { success: false, reason: 'Milestone not found' };
      if (ms.lienWaiverRequired && !ms.lienWaiverReceived) {
        return { success: false, reason: 'Lien waiver required before payment can be processed' };
      }
      ms.paidAt = new Date().toISOString();
      return { success: true, milestone: { ...ms } };
    },

    /**
     * Record lien waiver receipt
     */
    recordLienWaiver(milestoneId: string, _waiverType: LienWaiverType): PaymentMilestone | null {
      const ms = paymentMilestones.find(m => m.id === milestoneId);
      if (!ms) return null;
      ms.lienWaiverReceived = true;
      return { ...ms };
    },

    /**
     * Get milestones with outstanding lien waivers (paid but waiver not received)
     */
    outstandingLienWaivers(): PaymentMilestone[] {
      return paymentMilestones.filter(m => m.paidAt && m.lienWaiverRequired && !m.lienWaiverReceived);
    },

    getPaymentScheduleSummary(): { totalScheduled: number; totalInvoiced: number; totalPaid: number; retentionHeld: number } {
      const totalScheduled = paymentMilestones.reduce((s, m) => s + m.amount, 0);
      const totalInvoiced = paymentMilestones.filter(m => m.invoicedAt).reduce((s, m) => s + m.amount, 0);
      const totalPaid = paymentMilestones.filter(m => m.paidAt).reduce((s, m) => s + m.amount, 0);
      // Standard 10% retention held until substantial completion
      const retentionHeld = Math.round(totalPaid * 0.1);
      return { totalScheduled, totalInvoiced, totalPaid, retentionHeld };
    },

    getBidsRequiringCompliance(): SubcontractorBid[] {
      return bids.filter(b => b.isSelected && (!b.insuranceCurrent || (b.bondRequired && !b.insuranceCurrent)));
    },
  };
}
