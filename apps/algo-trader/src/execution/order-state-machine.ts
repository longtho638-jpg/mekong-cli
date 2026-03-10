/**
 * Order State Machine
 *
 * Defines valid state transitions for order lifecycle management.
 * Implements state transition validation with audit logging.
 */

import { logger } from '../utils/logger';

/**
 * Order states - represents the lifecycle of an order
 */
export enum OrderState {
  PENDING = 'pending',           // Order created, not yet submitted
  SUBMITTED = 'submitted',       // Order submitted to exchange
  PARTIALLY_FILLED = 'partially_filled',  // Partially executed
  FILLED = 'filled',             // Fully executed (terminal)
  CANCELLED = 'cancelled',       // Cancelled by user/system (terminal)
  REJECTED = 'rejected',         // Rejected by exchange (terminal)
  EXPIRED = 'expired',           // Expired (e.g., limit order timeout) (terminal)
}

/**
 * State transition triggers
 */
export type StateTransitionTrigger =
  | 'submit'
  | 'partial_fill'
  | 'full_fill'
  | 'cancel'
  | 'reject'
  | 'expire';

/**
 * Valid state transitions map
 * Defines which transitions are allowed from each state
 */
export const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  [OrderState.PENDING]: [OrderState.SUBMITTED, OrderState.CANCELLED],
  [OrderState.SUBMITTED]: [
    OrderState.PARTIALLY_FILLED,
    OrderState.FILLED,
    OrderState.CANCELLED,
    OrderState.REJECTED,
  ],
  [OrderState.PARTIALLY_FILLED]: [OrderState.FILLED, OrderState.CANCELLED],
  [OrderState.FILLED]: [],       // Terminal state
  [OrderState.CANCELLED]: [],    // Terminal state
  [OrderState.REJECTED]: [],     // Terminal state
  [OrderState.EXPIRED]: [],      // Terminal state
};

/**
 * State transition event
 */
export interface StateTransition {
  from: OrderState;
  to: OrderState;
  trigger: StateTransitionTrigger;
  timestamp: number;
  reason?: string;
}

/**
 * Order state transition result
 */
export interface TransitionResult {
  success: boolean;
  transition?: StateTransition;
  error?: string;
}

/**
 * Validates if a state transition is allowed
 */
export function isValidTransition(from: OrderState, to: OrderState): boolean {
  const validTargets = VALID_TRANSITIONS[from];
  return validTargets?.includes(to) ?? false;
}

/**
 * Gets the trigger type for a transition
 */
export function getTransitionTrigger(from: OrderState, to: OrderState): StateTransitionTrigger | null {
  if (to === OrderState.SUBMITTED) return 'submit';
  if (to === OrderState.PARTIALLY_FILLED) return 'partial_fill';
  if (to === OrderState.FILLED) return from === OrderState.PARTIALLY_FILLED ? 'full_fill' : 'submit';
  if (to === OrderState.CANCELLED) return 'cancel';
  if (to === OrderState.REJECTED) return 'reject';
  if (to === OrderState.EXPIRED) return 'expire';
  return null;
}

/**
 * Order state transition log entry
 */
export interface OrderTransitionLog {
  orderId: string;
  tenantId: string;
  exchangeId: string;
  fromState: OrderState;
  toState: OrderState;
  trigger: StateTransitionTrigger;
  timestamp: number;
  reason?: string;
}

/**
 * Order State Machine class
 * Manages state transitions with validation and logging
 */
export class OrderStateMachine {
  private currentState: OrderState;
  private transitionHistory: StateTransition[] = [];

  constructor(
    private orderId: string,
    private tenantId: string,
    private exchangeId: string,
    initialState: OrderState = OrderState.PENDING
  ) {
    this.currentState = initialState;
  }

  /**
   * Attempt to transition to a new state
   */
  async transition(toState: OrderState, reason?: string): Promise<TransitionResult> {
    const fromState = this.currentState;

    // Validate transition
    if (!isValidTransition(fromState, toState)) {
      const error = `Invalid transition from ${fromState} to ${toState}`;
      return { success: false, error };
    }

    const trigger = getTransitionTrigger(fromState, toState);
    if (!trigger) {
      return { success: false, error: 'Unknown transition trigger' };
    }

    const transition: StateTransition = {
      from: fromState,
      to: toState,
      trigger,
      timestamp: Date.now(),
      reason,
    };

    // Update state
    this.currentState = toState;
    this.transitionHistory.push(transition);

    // Log to audit
    this.logTransition({
      orderId: this.orderId,
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      fromState: transition.from,
      toState: transition.to,
      trigger: transition.trigger,
      timestamp: transition.timestamp,
      reason: transition.reason,
    });

    return { success: true, transition };
  }

  /**
   * Check if a transition is valid without executing it
   */
  canTransition(toState: OrderState): boolean {
    return isValidTransition(this.currentState, toState);
  }

  /**
   * Get current state
   */
  getState(): OrderState {
    return this.currentState;
  }

  /**
   * Check if order is in terminal state
   */
  isTerminal(): boolean {
    return VALID_TRANSITIONS[this.currentState].length === 0;
  }

  /**
   * Get transition history
   */
  getHistory(): StateTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Log transition to audit trail
   */
  private logTransition(log: OrderTransitionLog): void {
    logger.info('[ORDER-STATE-TRANSITION]', {
      orderId: log.orderId,
      tenantId: log.tenantId,
      exchangeId: log.exchangeId,
      fromState: log.fromState,
      toState: log.toState,
      trigger: log.trigger,
      timestamp: new Date(log.timestamp).toISOString(),
      reason: log.reason,
    });
  }
}
