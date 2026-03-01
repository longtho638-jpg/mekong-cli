/**
 * @agencyos/vibe-composable-commerce — Cart Engine
 *
 * In-memory cart management with discount application and tax calculation.
 * Framework-agnostic — works with any frontend or API layer.
 */

import type {
  Cart,
  CartItem,
  CartDiscount,
  Money,
} from './types';

// ─── Cart Engine Config ─────────────────────────────────────────

export interface CartEngineConfig {
  currency: string;
  taxRate: number;
  /** Persist cart (DB, Redis, etc.) */
  persist?: (cart: Cart) => Promise<void>;
  /** Load cart by ID */
  load?: (cartId: string) => Promise<Cart | null>;
  /** Validate discount code */
  validateDiscount?: (code: string) => Promise<CartDiscount | null>;
}

// ─── Cart Engine ────────────────────────────────────────────────

export function createCartEngine(config: CartEngineConfig) {
  const { currency, taxRate } = config;

  function money(amount: number): Money {
    return { amount: Math.round(amount * 100) / 100, currency };
  }

  function recalculate(cart: Cart): void {
    // Subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      item.totalPrice = money(item.unitPrice.amount * item.quantity);
      subtotal += item.totalPrice.amount;
    }
    cart.subtotal = money(subtotal);

    // Apply discounts
    let discountTotal = 0;
    for (const discount of cart.discounts) {
      if (discount.type === 'percentage') {
        discount.appliedAmount = money(subtotal * (discount.value / 100));
      } else if (discount.type === 'fixed') {
        discount.appliedAmount = money(Math.min(discount.value, subtotal));
      } else if (discount.type === 'free_shipping') {
        discount.appliedAmount = money(cart.shipping.amount);
      }
      discountTotal += discount.appliedAmount.amount;
    }

    // Tax on discounted subtotal
    const taxableAmount = Math.max(0, subtotal - discountTotal);
    cart.tax = money(taxableAmount * taxRate);

    // Total
    cart.total = money(taxableAmount + cart.tax.amount + cart.shipping.amount);
    cart.updatedAt = new Date().toISOString();
  }

  return {
    /** Create a new cart */
    async createCart(customerId?: string): Promise<Cart> {
      const cart: Cart = {
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        customerId,
        items: [],
        discounts: [],
        subtotal: money(0),
        tax: money(0),
        shipping: money(0),
        total: money(0),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Add item to cart */
    async addItem(cart: Cart, item: Omit<CartItem, 'id' | 'totalPrice'>): Promise<Cart> {
      const existing = cart.items.find(i => i.variantId === item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.items.push({
          ...item,
          id: `ci_${Date.now()}`,
          totalPrice: money(0),
        });
      }

      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Update item quantity */
    async updateQuantity(cart: Cart, variantId: string, quantity: number): Promise<Cart> {
      if (quantity <= 0) {
        cart.items = cart.items.filter(i => i.variantId !== variantId);
      } else {
        const item = cart.items.find(i => i.variantId === variantId);
        if (item) item.quantity = quantity;
      }

      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Remove item from cart */
    async removeItem(cart: Cart, variantId: string): Promise<Cart> {
      cart.items = cart.items.filter(i => i.variantId !== variantId);
      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Apply discount code */
    async applyDiscount(cart: Cart, code: string): Promise<Cart> {
      if (cart.discounts.some(d => d.code === code)) {
        throw new Error(`Discount already applied: ${code}`);
      }

      if (config.validateDiscount) {
        const discount = await config.validateDiscount(code);
        if (!discount) throw new Error(`Invalid discount code: ${code}`);
        cart.discounts.push(discount);
      }

      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Set shipping cost */
    async setShipping(cart: Cart, shippingCost: number): Promise<Cart> {
      cart.shipping = money(shippingCost);
      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },

    /** Get cart (from persistence or memory) */
    async getCart(cartId: string): Promise<Cart | null> {
      if (config.load) return config.load(cartId);
      return null;
    },

    /** Clear all items */
    async clearCart(cart: Cart): Promise<Cart> {
      cart.items = [];
      cart.discounts = [];
      recalculate(cart);
      if (config.persist) await config.persist(cart);
      return cart;
    },
  };
}
