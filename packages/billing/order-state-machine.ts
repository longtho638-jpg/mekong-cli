/**
 * Order state machine — status types, valid transitions, action resolution.
 * Reusable across any e-commerce app (anima119, 84tea, etc.)
 */

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface StateTransition {
  from: OrderStatus[];
  to: OrderStatus;
}

const ORDER_TRANSITIONS: StateTransition[] = [
  { from: ['pending'], to: 'processing' },
  { from: ['pending'], to: 'cancelled' },
  { from: ['processing'], to: 'shipped' },
  { from: ['processing'], to: 'cancelled' },
  { from: ['shipped'], to: 'delivered' },
  { from: ['shipped'], to: 'cancelled' },
  { from: ['delivered'], to: 'refunded' },
];

/** Check if transitioning from current to next status is valid */
export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  const transition = ORDER_TRANSITIONS.find(t => t.to === next);
  return transition ? transition.from.includes(current) : false;
}

/** Get recommended next action label based on current status */
export function getNextOrderAction(status: OrderStatus, paymentStatus: PaymentStatus): string {
  switch (status) {
    case 'pending':
      return paymentStatus === 'paid' ? 'Process Order' : 'Wait for Payment';
    case 'processing':
      return 'Ship Order';
    case 'shipped':
      return 'Mark Delivered';
    default:
      return 'View Details';
  }
}
