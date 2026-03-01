/**
 * Regulatory Facade — Pharma Hub SDK
 * FDA/EMA compliance, submissions, pharmacovigilance
 */

export interface RegulatorySubmission {
  id: string;
  drugId: string;
  agency: 'FDA' | 'EMA' | 'PMDA' | 'ANVISA' | 'other';
  submissionType: 'IND' | 'NDA' | 'BLA' | 'ANDA' | 'MAA';
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';
  submittedAt?: string;
  decisionAt?: string;
  referenceNumber?: string;
}

export interface ComplianceCheck {
  submissionId: string;
  checkType: string;
  passed: boolean;
  findings: string[];
  checkedAt: string;
}

export interface AdverseEvent {
  id: string;
  drugId: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening' | 'fatal';
  description: string;
  reportedAt: string;
  reportedBy: string;
  caseNumber: string;
}

export function createRegulatoryManager() {
  return {
    createSubmission: async (_data: Omit<RegulatorySubmission, 'id' | 'status'>): Promise<RegulatorySubmission> => {
      throw new Error('Implement with your regulatory backend');
    },
    runComplianceCheck: async (_submissionId: string): Promise<ComplianceCheck> => {
      throw new Error('Implement with your compliance backend');
    },
    reportAdverseEvent: async (_data: Omit<AdverseEvent, 'id' | 'caseNumber'>): Promise<AdverseEvent> => {
      throw new Error('Implement with your pharmacovigilance backend');
    },
    getSubmissionStatus: async (_submissionId: string): Promise<RegulatorySubmission> => {
      throw new Error('Implement with your regulatory backend');
    },
  };
}
