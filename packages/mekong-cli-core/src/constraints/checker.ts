/**
 * Constraint checker — enforces rules from SOUL.md boundaries.
 * Called before each agent iteration (Jidoka principle).
 */
import type { ParsedIdentityConfig } from '../memory/identity.js';
import { emit } from '../core/events.js';

export interface ConstraintCheck {
  ok: boolean;
  violation?: string;
  severity: 'warning' | 'error' | 'critical';
}

interface IterationContext {
  iteration: number;
  tokensUsed: number;
  timeElapsedSeconds: number;
  lastActionFailed?: boolean;
}

const DEFAULT_CONTROLS = {
  wipLimit: 3,
  maxTaskDepth: 5,
  maxTokensPerTurn: 4096,
  timeLimit: 300,
};

export class ConstraintChecker {
  private identity?: ParsedIdentityConfig;
  private consecutiveFailures: number = 0;
  private readonly maxConsecutiveFailures: number = 3;

  /** Load identity constraints */
  setIdentity(identity: ParsedIdentityConfig): void {
    this.identity = identity;
  }

  /** Check all constraints before an agent iteration */
  check(context: IterationContext): ConstraintCheck {
    if (context.lastActionFailed) {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }

    const controls = this.identity?.scopeControls ?? DEFAULT_CONTROLS;

    // Jidoka: stop after N consecutive failures
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      const violation = `${this.consecutiveFailures} consecutive failures — stopping (Jidoka)`;
      emit('constraint:violation', { type: 'consecutive_failures', violation });
      return { ok: false, violation, severity: 'critical' };
    }

    // Iteration depth guard
    if (context.iteration > controls.maxTaskDepth * 2) {
      const violation = `Iteration limit exceeded: ${context.iteration}`;
      emit('constraint:violation', { type: 'iteration_limit', violation });
      return { ok: false, violation, severity: 'error' };
    }

    // Time limit
    if (context.timeElapsedSeconds > controls.timeLimit) {
      const violation = `Time limit exceeded: ${context.timeElapsedSeconds}s > ${controls.timeLimit}s`;
      emit('constraint:violation', { type: 'time_limit', violation });
      return { ok: false, violation, severity: 'error' };
    }

    // Token limit (warning only — caller decides whether to stop)
    if (context.tokensUsed > controls.maxTokensPerTurn) {
      const violation = `Token limit exceeded: ${context.tokensUsed} > ${controls.maxTokensPerTurn}`;
      emit('constraint:violation', { type: 'token_limit', violation });
      return { ok: false, violation, severity: 'warning' };
    }

    return { ok: true, severity: 'warning' };
  }

  /** Reset failure counter */
  resetFailures(): void {
    this.consecutiveFailures = 0;
  }
}
