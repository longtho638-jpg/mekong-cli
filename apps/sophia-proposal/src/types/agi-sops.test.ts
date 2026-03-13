/**
 * Tests for AGI SOPs TypeScript types
 * Validates type structures and utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  SOP,
  SOPStep,
  QualityGate,
  StepStatus,
  ExecutionStatus,
  ExecutionResult,
  SOPListResponse,
  SearchResponse,
  PlanRequest,
  PlanResponse,
} from './agi-sops';

describe('AGI SOPs Types', () => {
  describe('SOP interface', () => {
    it('should create valid SOP object', () => {
      const sop: SOP = {
        name: 'test-sop',
        version: '1.0.0',
        description: 'Test SOP',
        steps: [],
        quality_gates: [],
        metadata: { key: 'value' },
      };

      expect(sop.name).toBe('test-sop');
      expect(sop.version).toBe('1.0.0');
      expect(sop.description).toBe('Test SOP');
      expect(sop.steps).toEqual([]);
      expect(sop.quality_gates).toEqual([]);
      expect(sop.metadata).toEqual({ key: 'value' });
    });

    it('should create SOP with steps', () => {
      const step: SOPStep = {
        id: 'step-1',
        command: 'echo test',
        timeout: 5000,
        validation: 'test',
        rollback: 'echo rollback',
        description: 'Test step',
        status: 'pending',
      };

      const sop: SOP = {
        name: 'sop-with-steps',
        version: '1.0.0',
        description: 'SOP with steps',
        steps: [step],
        quality_gates: [],
      };

      expect(sop.steps).toHaveLength(1);
      expect(sop.steps[0].id).toBe('step-1');
      expect(sop.steps[0].command).toBe('echo test');
    });

    it('should work without optional metadata', () => {
      const sop: SOP = {
        name: 'minimal-sop',
        version: '1.0.0',
        description: 'Minimal SOP',
        steps: [],
        quality_gates: [],
      };

      expect(sop.metadata).toBeUndefined();
    });
  });

  describe('SOPStep interface', () => {
    it('should create minimal step', () => {
      const step: SOPStep = {
        id: 'minimal-step',
        command: 'ls -la',
      };

      expect(step.id).toBe('minimal-step');
      expect(step.command).toBe('ls -la');
      expect(step.timeout).toBeUndefined();
      expect(step.status).toBeUndefined();
    });

    it('should create step with all properties', () => {
      const step: SOPStep = {
        id: 'full-step',
        command: 'npm test',
        timeout: 30000,
        validation: 'exit code 0',
        rollback: 'git reset --hard',
        description: 'Run tests',
        status: 'running',
        output: 'Test output',
        error: undefined,
        duration_ms: 1500,
      };

      expect(step.timeout).toBe(30000);
      expect(step.duration_ms).toBe(1500);
    });
  });

  describe('StepStatus type', () => {
    it('should accept all valid status values', () => {
      const statuses: StepStatus[] = ['pending', 'running', 'success', 'failed', 'skipped'];

      statuses.forEach(status => {
        expect(['pending', 'running', 'success', 'failed', 'skipped']).toContain(status);
      });
    });
  });

  describe('ExecutionStatus type', () => {
    it('should accept all valid execution status values', () => {
      const statuses: ExecutionStatus[] = ['pending', 'running', 'success', 'failed', 'rolled_back'];

      statuses.forEach(status => {
        expect(['pending', 'running', 'success', 'failed', 'rolled_back']).toContain(status);
      });
    });
  });

  describe('QualityGate interface', () => {
    it('should create minimal quality gate', () => {
      const gate: QualityGate = {
        name: 'test-gate',
        check: 'coverage > 80',
      };

      expect(gate.name).toBe('test-gate');
      expect(gate.check).toBe('coverage > 80');
      expect(gate.description).toBeUndefined();
    });

    it('should create quality gate with results', () => {
      const gate: QualityGate = {
        name: 'coverage-gate',
        check: 'coverage > 80',
        description: 'Ensure code coverage above 80%',
        passed: true,
        message: 'Coverage is 85%',
      };

      expect(gate.passed).toBe(true);
      expect(gate.message).toBe('Coverage is 85%');
    });
  });

  describe('ExecutionResult interface', () => {
    beforeEach(() => {
      // Reset before each test
    });

    it('should create successful execution result', () => {
      const result: ExecutionResult = {
        success: true,
        status: 'success',
        sop_name: 'test-sop',
        steps_completed: 5,
        steps_failed: 0,
        steps_skipped: 0,
        duration_ms: 2500,
        outputs: {},
      };

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.steps_completed).toBe(5);
    });

    it('should create failed execution result with error', () => {
      const result: ExecutionResult = {
        success: false,
        status: 'failed',
        sop_name: 'test-sop',
        steps_completed: 2,
        steps_failed: 1,
        steps_skipped: 2,
        error: 'Step 3 failed: timeout',
        outputs: {
          'step-1': { success: true, output: 'OK' },
          'step-2': { success: true, output: 'OK' },
          'step-3': { success: false, output: '' },
        },
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Step 3 failed: timeout');
    });

    it('should create rolled back execution result', () => {
      const result: ExecutionResult = {
        success: false,
        status: 'rolled_back',
        sop_name: 'test-sop',
        steps_completed: 0,
        steps_failed: 1,
        steps_skipped: 4,
        outputs: {},
        rollback_performed: true,
      };

      expect(result.rollback_performed).toBe(true);
      expect(result.status).toBe('rolled_back');
    });
  });

  describe('SOPListResponse interface', () => {
    it('should create SOP list response', () => {
      const response: SOPListResponse = {
        sops: [
          {
            name: 'deploy-sop',
            version: '1.0.0',
            description: 'Deployment SOP',
            steps_count: 5,
          },
          {
            name: 'test-sop',
            version: '2.0.0',
            description: 'Testing SOP',
            steps_count: 3,
          },
        ],
      };

      expect(response.sops).toHaveLength(2);
      expect(response.sops[0].name).toBe('deploy-sop');
      expect(response.sops[1].steps_count).toBe(3);
    });

    it('should create empty SOP list', () => {
      const response: SOPListResponse = {
        sops: [],
      };

      expect(response.sops).toEqual([]);
    });
  });

  describe('SearchResponse interface', () => {
    it('should create search response with results', () => {
      const response: SearchResponse = {
        results: [
          {
            name: 'deploy-sop',
            content: 'Deployment standard operating procedure',
            distance: 0.15,
          },
          {
            name: 'test-sop',
            content: 'Testing standard operating procedure',
            distance: 0.25,
          },
        ],
      };

      expect(response.results).toHaveLength(2);
      expect(response.results[0].distance).toBe(0.15);
    });
  });

  describe('PlanRequest interface', () => {
    it('should create minimal plan request', () => {
      const request: PlanRequest = {
        goal: 'Deploy to production',
      };

      expect(request.goal).toBe('Deploy to production');
      expect(request.context).toBeUndefined();
    });

    it('should create plan request with context', () => {
      const request: PlanRequest = {
        goal: 'Deploy to production',
        context: 'Production environment: AWS, us-east-1',
      };

      expect(request.context).toBe('Production environment: AWS, us-east-1');
    });
  });

  describe('PlanResponse interface', () => {
    it('should create plan response', () => {
      const response: PlanResponse = {
        plan: 'Deploy using CI/CD pipeline',
        steps: [
          {
            id: '1',
            description: 'Run tests',
            command: 'npm test',
          },
          {
            id: '2',
            description: 'Build application',
            command: 'npm run build',
          },
          {
            id: '3',
            description: 'Deploy to production',
          },
        ],
      };

      expect(response.steps).toHaveLength(3);
      expect(response.steps[0].command).toBe('npm test');
      expect(response.steps[2].command).toBeUndefined();
    });
  });
});
