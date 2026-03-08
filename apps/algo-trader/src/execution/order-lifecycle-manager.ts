/**
 * Order Lifecycle Manager
 *
 * Manages the full lifecycle of orders including:
 * - State machine transitions
 * - Background polling for brokers without webhooks
 * - Webhook handler for fill updates
 * - Cancel and status operations
 */

import { OrderState, OrderStateMachine, VALID_TRANSITIONS } from './order-state-machine';
import { createAuditLogger, AuditLogger } from './audit-logger';
import { ExchangeConnectionPool } from './exchange-connection-pool';

/**
 * Order interface representing a trading order
 */
export interface Order {
  id: string;
  clientOrderId?: string;        // Idempotency key
  tenantId: string;
  exchangeId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: OrderState;

  // Timestamps
  createdAt: number;
  submittedAt?: number;
  filledAt?: number;
  cancelledAt?: number;

  // Execution details
  avgFillPrice?: number;
  totalFilled?: number;
  remainingAmount?: number;

  // Audit
  ip?: string;
  userAgent?: string;
  strategyId?: string;
}

/**
 * Order status response
 */
export interface OrderStatus {
  orderId: string;
  clientOrderId?: string;
  status: OrderState;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  avgFillPrice?: number;
  totalFilled?: number;
  remainingAmount?: number;
  createdAt: number;
  submittedAt?: number;
  filledAt?: number;
  cancelledAt?: number;
}

/**
 * Fill update from webhook or polling
 */
export interface FillUpdate {
  orderId: string;
  fillPrice: number;
  fillAmount: number;
  timestamp: number;
}

/**
 * Order Lifecycle Manager configuration
 */
export interface LifecycleConfig {
  pollingIntervalMs: number;     // Default: 5000 (5 seconds)
  maxPollAttempts: number;       // Default: 120 (10 minutes max)
  enablePolling: boolean;        // Enable background polling
}

const DEFAULT_CONFIG: LifecycleConfig = {
  pollingIntervalMs: 5000,
  maxPollAttempts: 120,
  enablePolling: true,
};

/**
 * Order Lifecycle Manager class
 * Manages order state machine with polling and webhook support
 */
export class OrderLifecycleManager {
  private orders: Map<string, Order> = new Map();
  private stateMachines: Map<string, OrderStateMachine> = new Map();
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map();
  private processedWebhooks: Set<string> = new Set();  // Idempotency tracking
  private config: LifecycleConfig;
  private connectionPool: ExchangeConnectionPool;

  constructor(config: Partial<LifecycleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connectionPool = ExchangeConnectionPool.getInstance();
  }

  /**
   * Create and submit a new order
   */
  async submitOrder(order: Order): Promise<Order> {
    // Initialize order
    order.status = OrderState.PENDING;
    order.createdAt = Date.now();
    order.remainingAmount = order.amount;
    order.totalFilled = 0;

    // Create state machine
    const stateMachine = new OrderStateMachine(
      order.id,
      order.tenantId,
      order.exchangeId,
      OrderState.PENDING
    );

    // Transition to SUBMITTED
    await stateMachine.transition(OrderState.SUBMITTED);
    order.status = OrderState.SUBMITTED;
    order.submittedAt = Date.now();

    // Store order and state machine
    this.orders.set(order.id, order);
    this.stateMachines.set(order.id, stateMachine);

    // Start polling for non-webhook brokers
    if (this.config.enablePolling) {
      this.startPolling(order.id);
    }

    return order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const stateMachine = this.stateMachines.get(orderId);
    if (!stateMachine) {
      throw new Error(`State machine for order ${orderId} not found`);
    }

    // Check if can transition to CANCELLED
    if (!stateMachine.canTransition(OrderState.CANCELLED)) {
      throw new Error(
        `Cannot cancel order in state ${order.status}. ` +
        `Valid transitions: ${VALID_TRANSITIONS[order.status].join(', ') || 'none (terminal)'}`
      );
    }

    // Execute state transition
    await stateMachine.transition(OrderState.CANCELLED, reason);
    order.status = OrderState.CANCELLED;
    order.cancelledAt = Date.now();

    // Call exchange cancel
    try {
      const connection = this.connectionPool.getConnection(order.exchangeId);
      if (connection?.connected) {
        // Exchange-specific cancel logic would go here
        // For now, just log
      }
    } catch (error) {
      // Log error but don't fail - state already updated
    }

    // Stop polling
    this.stopPolling(orderId);

    return order;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return {
      orderId: order.id,
      clientOrderId: order.clientOrderId,
      status: order.status,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      amount: order.amount,
      price: order.price,
      avgFillPrice: order.avgFillPrice,
      totalFilled: order.totalFilled,
      remainingAmount: order.remainingAmount,
      createdAt: order.createdAt,
      submittedAt: order.submittedAt,
      filledAt: order.filledAt,
      cancelledAt: order.cancelledAt,
    };
  }

  /**
   * Handle fill webhook update
   * Idempotent - safe to call multiple times with same data
   */
  async handleFillWebhook(
    orderId: string,
    fillPrice: number,
    fillAmount: number,
    webhookId?: string
  ): Promise<void> {
    // Idempotency check
    if (webhookId && this.processedWebhooks.has(webhookId)) {
      return;  // Already processed
    }

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const stateMachine = this.stateMachines.get(orderId);
    if (!stateMachine) {
      throw new Error(`State machine for order ${orderId} not found`);
    }

    // Update fill details
    order.totalFilled = (order.totalFilled || 0) + fillAmount;
    order.remainingAmount = order.amount - order.totalFilled;

    // Calculate average fill price
    if (order.avgFillPrice) {
      const totalValue = (order.avgFillPrice * (order.totalFilled - fillAmount)) + (fillPrice * fillAmount);
      order.avgFillPrice = totalValue / order.totalFilled;
    } else {
      order.avgFillPrice = fillPrice;
    }

    // Determine new state
    let newState: OrderState;
    if (order.remainingAmount <= 0) {
      newState = OrderState.FILLED;
      order.filledAt = Date.now();
    } else {
      newState = OrderState.PARTIALLY_FILLED;
    }

    // Execute transition if valid
    if (stateMachine.canTransition(newState)) {
      await stateMachine.transition(newState);
      order.status = newState;
    }

    // Mark webhook as processed
    if (webhookId) {
      this.processedWebhooks.add(webhookId);
    }

    // Stop polling if terminal state
    if (stateMachine.isTerminal()) {
      this.stopPolling(orderId);
    }
  }

  /**
   * Start background polling for order updates
   */
  private startPolling(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    let pollCount = 0;

    const timer = setInterval(async () => {
      pollCount++;
      const currentOrder = this.orders.get(orderId);

      // Stop if terminal state or max attempts reached
      if (!currentOrder || this.isTerminalState(currentOrder.status)) {
        this.stopPolling(orderId);
        return;
      }

      if (pollCount >= this.config.maxPollAttempts) {
        // Mark as expired
        const stateMachine = this.stateMachines.get(orderId);
        if (stateMachine?.canTransition(OrderState.EXPIRED)) {
          await stateMachine.transition(OrderState.EXPIRED, 'Max poll attempts reached');
          currentOrder.status = OrderState.EXPIRED;
        }
        this.stopPolling(orderId);
        return;
      }

      // Fetch order status from exchange
      try {
        await this.fetchAndUpdateOrder(orderId);
      } catch (error) {
        // Log error, continue polling
      }
    }, this.config.pollingIntervalMs);

    this.pollingTimers.set(orderId, timer);
  }

  /**
   * Stop polling for an order
   */
  private stopPolling(orderId: string): void {
    const timer = this.pollingTimers.get(orderId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(orderId);
    }
  }

  /**
   * Fetch order status from exchange and update local state
   */
  private async fetchAndUpdateOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    const connection = this.connectionPool.getConnection(order.exchangeId);
    if (!connection?.connected) return;

    // Exchange-specific fetch logic would go here
    // For now, this is a placeholder
  }

  /**
   * Check if state is terminal
   */
  private isTerminalState(state: OrderState): boolean {
    return VALID_TRANSITIONS[state].length === 0;
  }

  /**
   * Get all orders for a tenant
   */
  getOrdersByTenant(tenantId: string): Order[] {
    return Array.from(this.orders.values()).filter(o => o.tenantId === tenantId);
  }

  /**
   * Get orders by symbol
   */
  getOrdersBySymbol(symbol: string): Order[] {
    return Array.from(this.orders.values()).filter(o => o.symbol === symbol);
  }

  /**
   * Clear processed webhooks set (for memory management)
   */
  clearProcessedWebhooks(maxAge: number = 3600000): void {
    const cutoff = Date.now() - maxAge;
    // In production, would use a more sophisticated cache
    this.processedWebhooks.clear();
  }
}

// Singleton instance for global access
let globalLifecycleManager: OrderLifecycleManager | null = null;

export function getOrderLifecycleManager(config?: Partial<LifecycleConfig>): OrderLifecycleManager {
  if (!globalLifecycleManager) {
    globalLifecycleManager = new OrderLifecycleManager(config);
  }
  return globalLifecycleManager;
}
