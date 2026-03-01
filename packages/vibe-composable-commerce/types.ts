/**
 * @agencyos/vibe-composable-commerce — Type Definitions
 *
 * Types for headless commerce: catalog, cart, checkout, fulfillment.
 */

// ─── Configuration ──────────────────────────────────────────────

export interface CommerceConfig {
  engine: 'commercetools' | 'medusa' | 'saleor' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  currency: string;
  locale: string;
}

// ─── Catalog ────────────────────────────────────────────────────

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  variants: ProductVariant[];
  categories: string[];
  images: { url: string; alt: string }[];
  metadata: Record<string, string>;
  status: 'draft' | 'active' | 'archived';
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: Money;
  compareAtPrice?: Money;
  inventory: { quantity: number; trackInventory: boolean };
  attributes: Record<string, string>;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId?: string;
  productCount: number;
}

// ─── Cart ───────────────────────────────────────────────────────

export interface Cart {
  id: string;
  customerId?: string;
  items: CartItem[];
  discounts: CartDiscount[];
  subtotal: Money;
  tax: Money;
  shipping: Money;
  total: Money;
  status: 'active' | 'merged' | 'ordered' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  metadata?: Record<string, string>;
}

export interface CartDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  appliedAmount: Money;
}

// ─── Checkout ───────────────────────────────────────────────────

export interface CheckoutSession {
  id: string;
  cartId: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: ShippingMethod;
  paymentMethod?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  estimatedDays: number;
  price: Money;
}

// ─── Order & Fulfillment ────────────────────────────────────────

export interface Order {
  id: string;
  cartId: string;
  customerId: string;
  items: CartItem[];
  total: Money;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded';
  fulfillments: Fulfillment[];
  createdAt: string;
}

export interface Fulfillment {
  id: string;
  strategy: 'ship-from-store' | 'warehouse' | 'dropship' | '3pl';
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned';
  items: { variantId: string; quantity: number }[];
}
