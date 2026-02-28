/**
 * @agencyos/vibe-ecommerce — E-Commerce Facade SDK
 *
 * Product catalog, cart management, order lifecycle, pricing engine, promotions.
 *
 * Usage:
 *   import { createCartEngine, createOrderManager, createPromotionEngine } from '@agencyos/vibe-ecommerce';
 */

// ─── Types ──────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  customerEmail: string;
  shippingAddress: string;
  createdAt: string;
}

// ─── Cart Engine ────────────────────────────────────────────────

export function createCartEngine() {
  let items: CartItem[] = [];

  return {
    getItems: () => [...items],

    addItem(item: CartItem): CartItem[] {
      const existing = items.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({ ...item });
      }
      return [...items];
    },

    removeItem(productId: string, variantId?: string): CartItem[] {
      items = items.filter(i => !(i.productId === productId && i.variantId === variantId));
      return [...items];
    },

    updateQuantity(productId: string, quantity: number): CartItem[] {
      const item = items.find(i => i.productId === productId);
      if (item) item.quantity = Math.max(0, quantity);
      items = items.filter(i => i.quantity > 0);
      return [...items];
    },

    clear(): CartItem[] {
      items = [];
      return [];
    },

    getSubtotal(): number {
      return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },

    getItemCount(): number {
      return items.reduce((sum, i) => sum + i.quantity, 0);
    },
  };
}

// ─── Order Manager ──────────────────────────────────────────────

export function createOrderManager() {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  return {
    /**
     * Check co the chuyen trang thai khong
     */
    canTransition(from: OrderStatus, to: OrderStatus): boolean {
      return validTransitions[from]?.includes(to) ?? false;
    },

    /**
     * Tinh order totals
     */
    calculateTotals(items: CartItem[], shippingFee: number, discountAmount: number, taxRate: number): {
      subtotal: number; shippingFee: number; discount: number; tax: number; total: number;
    } {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const taxableAmount = subtotal - discountAmount;
      const tax = Math.round(Math.max(0, taxableAmount) * taxRate);
      const total = subtotal + shippingFee - discountAmount + tax;
      return { subtotal, shippingFee, discount: discountAmount, tax, total: Math.max(0, total) };
    },

    /**
     * Check order co the cancel duoc khong
     */
    isCancellable(status: OrderStatus): boolean {
      return ['pending', 'confirmed', 'processing'].includes(status);
    },

    /**
     * Tinh refund amount (partial or full)
     */
    calculateRefund(order: Order, itemsToRefund: string[]): number {
      if (itemsToRefund.length === 0) return order.total;
      return order.items
        .filter(i => itemsToRefund.includes(i.productId))
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
  };
}

// ─── Promotion Engine ───────────────────────────────────────────

export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping' | 'bundle';

export interface Promotion {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  currentUsage: number;
}

export function createPromotionEngine() {
  return {
    /**
     * Validate promotion code
     */
    validate(promo: Promotion, orderAmount: number): { valid: boolean; reason?: string } {
      const now = new Date();
      if (now < new Date(promo.validFrom)) return { valid: false, reason: 'Chua den ngay ap dung' };
      if (now > new Date(promo.validUntil)) return { valid: false, reason: 'Ma khuyen mai da het han' };
      if (promo.usageLimit && promo.currentUsage >= promo.usageLimit) return { valid: false, reason: 'Da het luot su dung' };
      if (promo.minOrderAmount && orderAmount < promo.minOrderAmount) return { valid: false, reason: `Don hang toi thieu ${promo.minOrderAmount}` };
      return { valid: true };
    },

    /**
     * Tinh discount amount
     */
    calculateDiscount(promo: Promotion, orderAmount: number): number {
      let discount = 0;
      switch (promo.type) {
        case 'percentage':
          discount = Math.round(orderAmount * (promo.value / 100));
          break;
        case 'fixed':
          discount = promo.value;
          break;
        case 'free_shipping':
          discount = 0;
          break;
        default:
          discount = 0;
      }
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
      return Math.min(discount, orderAmount);
    },
  };
}
