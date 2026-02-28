/**
 * Self-Healing Agent Loop — Plan → Execute → Verify with auto-recovery
 *
 * TypeScript port of mekong-cli's RecipeOrchestrator pattern.
 * Provides autonomous task execution with:
 * - Step-by-step execution with verification
 * - Automatic retry with exponential backoff
 * - Self-healing via LLM-powered error correction
 * - Rollback on unrecoverable failures
 * - Audit trail for every step
 */

// ─── Types ──────────────────────────────────────────────────────

export type StepMode = 'shell' | 'llm' | 'api' | 'function';

export type LoopStatus = 'success' | 'failed' | 'partial' | 'rolled_back';

export interface TaskStep {
  id: string;
  name: string;
  mode: StepMode;
  command: string;
  verifyFn?: (result: StepExecutionResult) => boolean;
  rollbackFn?: () => Promise<void>;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface StepExecutionResult {
  stepId: string;
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
  retryCount: number;
  selfHealed: boolean;
}

export interface LoopResult {
  status: LoopStatus;
  steps: StepExecutionResult[];
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  totalDurationMs: number;
  errors: string[];
}

export interface SelfHealingConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Optional LLM-powered error analysis for self-healing */
  analyzeError?: (step: TaskStep, error: string) => Promise<string | null>;
  /** Execute a command (shell/API) */
  executeCommand: (command: string, mode: StepMode, timeoutMs?: number) => Promise<{ success: boolean; output: string; error?: string }>;
  /** Audit logger */
  onStepComplete?: (result: StepExecutionResult) => void;
}

// ─── Core Loop ──────────────────────────────────────────────────

/**
 * Execute a self-healing agent loop.
 *
 * For each step:
 * 1. Execute command
 * 2. Verify result (if verifyFn provided)
 * 3. On failure: retry with exponential backoff
 * 4. On repeated failure: attempt self-healing via LLM error analysis
 * 5. On unrecoverable failure: rollback completed steps
 */
export async function runSelfHealingLoop(
  steps: TaskStep[],
  config: SelfHealingConfig,
): Promise<LoopResult> {
  const results: StepExecutionResult[] = [];
  const completedSteps: TaskStep[] = [];
  const startTime = Date.now();
  const errors: string[] = [];

  for (const step of steps) {
    const stepResult = await executeStepWithRetry(step, config);
    results.push(stepResult);

    config.onStepComplete?.(stepResult);

    if (stepResult.success) {
      completedSteps.push(step);
    } else {
      errors.push(`Step "${step.name}" failed: ${stepResult.error ?? 'unknown'}`);

      // Rollback completed steps in reverse order
      await rollbackSteps(completedSteps);

      return {
        status: completedSteps.length > 0 ? 'partial' : 'failed',
        steps: results,
        totalSteps: steps.length,
        completedSteps: completedSteps.length,
        failedSteps: 1,
        totalDurationMs: Date.now() - startTime,
        errors,
      };
    }
  }

  return {
    status: 'success',
    steps: results,
    totalSteps: steps.length,
    completedSteps: completedSteps.length,
    failedSteps: 0,
    totalDurationMs: Date.now() - startTime,
    errors,
  };
}

// ─── Step Execution with Retry ──────────────────────────────────

async function executeStepWithRetry(
  step: TaskStep,
  config: SelfHealingConfig,
): Promise<StepExecutionResult> {
  const maxRetries = step.maxRetries ?? config.maxRetries;
  let lastError = '';
  let command = step.command;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();

    const result = await config.executeCommand(command, step.mode, step.timeoutMs);

    const stepResult: StepExecutionResult = {
      stepId: step.id,
      success: result.success,
      output: result.output,
      error: result.error,
      durationMs: Date.now() - start,
      retryCount: attempt,
      selfHealed: attempt > 0 && result.success,
    };

    // Verify if verifyFn provided
    if (result.success && step.verifyFn) {
      stepResult.success = step.verifyFn(stepResult);
      if (!stepResult.success) {
        stepResult.error = 'Verification failed';
      }
    }

    if (stepResult.success) {
      return stepResult;
    }

    lastError = stepResult.error ?? 'Unknown error';

    // Don't retry on last attempt
    if (attempt >= maxRetries) {
      return stepResult;
    }

    // Self-healing: ask LLM to fix the command
    if (config.analyzeError) {
      const fixedCommand = await config.analyzeError(step, lastError);
      if (fixedCommand) {
        command = fixedCommand;
      }
    }

    // Exponential backoff
    const delay = Math.min(
      config.baseDelayMs * Math.pow(2, attempt),
      config.maxDelayMs,
    );
    await sleep(delay);
  }

  return {
    stepId: step.id,
    success: false,
    output: '',
    error: lastError,
    durationMs: 0,
    retryCount: maxRetries,
    selfHealed: false,
  };
}

// ─── Rollback ───────────────────────────────────────────────────

async function rollbackSteps(completedSteps: TaskStep[]): Promise<void> {
  // Rollback in reverse order
  for (let i = completedSteps.length - 1; i >= 0; i--) {
    const step = completedSteps[i];
    if (step.rollbackFn) {
      try {
        await step.rollbackFn();
      } catch {
        // Best-effort rollback — log but don't fail
      }
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convenience: create a simple agent loop config with defaults.
 */
export function createLoopConfig(
  executeCommand: SelfHealingConfig['executeCommand'],
  options?: Partial<Omit<SelfHealingConfig, 'executeCommand'>>,
): SelfHealingConfig {
  return {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    executeCommand,
    ...options,
  };
}
