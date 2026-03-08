/**
 * Order State Machine Tests
 *
 * Tests for order state transitions and validation.
 */

import {
  OrderState,
  OrderStateMachine,
  VALID_TRANSITIONS,
  isValidTransition,
  getTransitionTrigger,
} from './order-state-machine';

describe('Order State Machine', () => {
  describe('isValidTransition', () => {
    it('should allow PENDING -> SUBMITTED', () => {
      expect(isValidTransition(OrderState.PENDING, OrderState.SUBMITTED)).toBe(true);
    });

    it('should allow PENDING -> CANCELLED', () => {
      expect(isValidTransition(OrderState.PENDING, OrderState.CANCELLED)).toBe(true);
    });

    it('should reject PENDING -> FILLED', () => {
      expect(isValidTransition(OrderState.PENDING, OrderState.FILLED)).toBe(false);
    });

    it('should allow SUBMITTED -> PARTIALLY_FILLED', () => {
      expect(isValidTransition(OrderState.SUBMITTED, OrderState.PARTIALLY_FILLED)).toBe(true);
    });

    it('should allow SUBMITTED -> FILLED', () => {
      expect(isValidTransition(OrderState.SUBMITTED, OrderState.FILLED)).toBe(true);
    });

    it('should allow SUBMITTED -> CANCELLED', () => {
      expect(isValidTransition(OrderState.SUBMITTED, OrderState.CANCELLED)).toBe(true);
    });

    it('should allow SUBMITTED -> REJECTED', () => {
      expect(isValidTransition(OrderState.SUBMITTED, OrderState.REJECTED)).toBe(true);
    });

    it('should allow PARTIALLY_FILLED -> FILLED', () => {
      expect(isValidTransition(OrderState.PARTIALLY_FILLED, OrderState.FILLED)).toBe(true);
    });

    it('should allow PARTIALLY_FILLED -> CANCELLED', () => {
      expect(isValidTransition(OrderState.PARTIALLY_FILLED, OrderState.CANCELLED)).toBe(true);
    });

    it('should reject FILLED -> any state (terminal)', () => {
      expect(isValidTransition(OrderState.FILLED, OrderState.CANCELLED)).toBe(false);
      expect(isValidTransition(OrderState.FILLED, OrderState.PENDING)).toBe(false);
    });

    it('should reject CANCELLED -> any state (terminal)', () => {
      expect(isValidTransition(OrderState.CANCELLED, OrderState.SUBMITTED)).toBe(false);
    });

    it('should reject REJECTED -> any state (terminal)', () => {
      expect(isValidTransition(OrderState.REJECTED, OrderState.PENDING)).toBe(false);
    });
  });

  describe('getTransitionTrigger', () => {
    it('should return "submit" for SUBMITTED transition', () => {
      expect(getTransitionTrigger(OrderState.PENDING, OrderState.SUBMITTED)).toBe('submit');
    });

    it('should return "partial_fill" for PARTIALLY_FILLED transition', () => {
      expect(getTransitionTrigger(OrderState.SUBMITTED, OrderState.PARTIALLY_FILLED)).toBe('partial_fill');
    });

    it('should return "full_fill" for FILLED from PARTIALLY_FILLED', () => {
      expect(getTransitionTrigger(OrderState.PARTIALLY_FILLED, OrderState.FILLED)).toBe('full_fill');
    });

    it('should return "submit" for FILLED from SUBMITTED', () => {
      expect(getTransitionTrigger(OrderState.SUBMITTED, OrderState.FILLED)).toBe('submit');
    });

    it('should return "cancel" for CANCELLED transition', () => {
      expect(getTransitionTrigger(OrderState.SUBMITTED, OrderState.CANCELLED)).toBe('cancel');
    });

    it('should return "reject" for REJECTED transition', () => {
      expect(getTransitionTrigger(OrderState.SUBMITTED, OrderState.REJECTED)).toBe('reject');
    });

    it('should return "expire" for EXPIRED transition', () => {
      expect(getTransitionTrigger(OrderState.SUBMITTED, OrderState.EXPIRED)).toBe('expire');
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('should have correct transitions for all states', () => {
      expect(VALID_TRANSITIONS[OrderState.PENDING]).toEqual([
        OrderState.SUBMITTED,
        OrderState.CANCELLED,
      ]);
      expect(VALID_TRANSITIONS[OrderState.SUBMITTED]).toEqual([
        OrderState.PARTIALLY_FILLED,
        OrderState.FILLED,
        OrderState.CANCELLED,
        OrderState.REJECTED,
      ]);
      expect(VALID_TRANSITIONS[OrderState.PARTIALLY_FILLED]).toEqual([
        OrderState.FILLED,
        OrderState.CANCELLED,
      ]);
      expect(VALID_TRANSITIONS[OrderState.FILLED]).toEqual([]);
      expect(VALID_TRANSITIONS[OrderState.CANCELLED]).toEqual([]);
      expect(VALID_TRANSITIONS[OrderState.REJECTED]).toEqual([]);
      expect(VALID_TRANSITIONS[OrderState.EXPIRED]).toEqual([]);
    });
  });

  describe('OrderStateMachine class', () => {
    let stateMachine: OrderStateMachine;

    beforeEach(() => {
      stateMachine = new OrderStateMachine(
        'order_test_123',
        'tenant_abc',
        'binance',
        OrderState.PENDING
      );
    });

    it('should initialize with PENDING state', () => {
      expect(stateMachine.getState()).toBe(OrderState.PENDING);
    });

    it('should transition from PENDING to SUBMITTED', async () => {
      const result = await stateMachine.transition(OrderState.SUBMITTED);
      expect(result.success).toBe(true);
      expect(stateMachine.getState()).toBe(OrderState.SUBMITTED);
    });

    it('should reject invalid transition', async () => {
      const result = await stateMachine.transition(OrderState.FILLED);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transition');
    });

    it('should track transition history', async () => {
      await stateMachine.transition(OrderState.SUBMITTED);
      await stateMachine.transition(OrderState.PARTIALLY_FILLED);
      await stateMachine.transition(OrderState.FILLED);

      const history = stateMachine.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].from).toBe(OrderState.PENDING);
      expect(history[0].to).toBe(OrderState.SUBMITTED);
      expect(history[2].to).toBe(OrderState.FILLED);
    });

    it('should detect terminal states', async () => {
      expect(stateMachine.isTerminal()).toBe(false);

      await stateMachine.transition(OrderState.SUBMITTED);
      expect(stateMachine.isTerminal()).toBe(false);

      await stateMachine.transition(OrderState.FILLED);
      expect(stateMachine.isTerminal()).toBe(true);
    });

    it('should allow checking if transition is possible without executing', async () => {
      expect(stateMachine.canTransition(OrderState.SUBMITTED)).toBe(true);
      expect(stateMachine.canTransition(OrderState.FILLED)).toBe(false);

      await stateMachine.transition(OrderState.SUBMITTED);
      expect(stateMachine.canTransition(OrderState.PARTIALLY_FILLED)).toBe(true);
      expect(stateMachine.canTransition(OrderState.CANCELLED)).toBe(true);
      expect(stateMachine.canTransition(OrderState.PENDING)).toBe(false);
    });

    it('should handle cancellation from SUBMITTED state', async () => {
      await stateMachine.transition(OrderState.SUBMITTED);
      const result = await stateMachine.transition(OrderState.CANCELLED, 'User requested');

      expect(result.success).toBe(true);
      expect(stateMachine.getState()).toBe(OrderState.CANCELLED);

      const history = stateMachine.getHistory();
      expect(history[history.length - 1].reason).toBe('User requested');
    });

    it('should handle rejection from SUBMITTED state', async () => {
      await stateMachine.transition(OrderState.SUBMITTED);
      const result = await stateMachine.transition(OrderState.REJECTED);

      expect(result.success).toBe(true);
      expect(stateMachine.getState()).toBe(OrderState.REJECTED);
      expect(stateMachine.isTerminal()).toBe(true);
    });
  });
});
