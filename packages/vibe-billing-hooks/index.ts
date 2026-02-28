/**
 * @agencyos/vibe-billing-hooks — Billing/Subscription/Payment Lifecycle Hooks
 *
 * Reusable logic hooks for SaaS billing flows. Framework-agnostic —
 * returns pure functions + state objects, not React hooks.
 *
 * Usage:
 *   import { createPricingHook, createCheckoutHook, createSubscriptionHook } from '@agencyos/vibe-billing-hooks';
 *   const pricing = createPricingHook({ plans, currency: 'VND' });
 *   const checkout = createCheckoutHook({ provider: 'polar' });
 *   const sub = createSubscriptionHook({ trialDays: 14 });
 */

import type { PlanTier, BillingCycle, PlanDefinition, PlanLimits } from '@agencyos/vibe-subscription';

// ─── Pricing Hook ───────────────────────────────────────────────

export interface PricingHookConfig {
  plans: PlanDefinition[];
  currency: string;
  defaultCycle?: BillingCycle;
}

export interface PricingState {
  selectedPlan: PlanTier | null;
  selectedCycle: BillingCycle;
  displayPrice: number;
  yearlyDiscount: number;
  features: string[];
}

export function createPricingHook(config: PricingHookConfig) {
  const { plans, currency, defaultCycle = 'monthly' } = config;

  let state: PricingState = {
    selectedPlan: null,
    selectedCycle: defaultCycle,
    displayPrice: 0,
    yearlyDiscount: 0,
    features: [],
  };

  return {
    getState: () => ({ ...state }),

    /**
     * Chon plan — update display price + features
     */
    selectPlan(tier: PlanTier): PricingState {
      const plan = plans.find(p => p.tier === tier);
      if (!plan) return state;

      const monthlyPrice = plan.price.monthly;
      const yearlyPrice = plan.price.yearly;
      const yearlyDiscount = monthlyPrice > 0
        ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
        : 0;

      state = {
        selectedPlan: tier,
        selectedCycle: state.selectedCycle,
        displayPrice: plan.price[state.selectedCycle],
        yearlyDiscount,
        features: plan.features,
      };
      return { ...state };
    },

    /**
     * Toggle billing cycle (monthly/yearly)
     */
    toggleCycle(cycle: BillingCycle): PricingState {
      state.selectedCycle = cycle;
      if (state.selectedPlan) {
        const plan = plans.find(p => p.tier === state.selectedPlan);
        if (plan) state.displayPrice = plan.price[cycle];
      }
      return { ...state };
    },

    /**
     * Format gia tien theo currency
     */
    formatPrice(amount: number): string {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
    },

    /**
     * So sanh 2 plans — tra ve feature diff
     */
    comparePlans(tierA: PlanTier, tierB: PlanTier): { onlyInA: string[]; onlyInB: string[]; shared: string[] } {
      const planA = plans.find(p => p.tier === tierA);
      const planB = plans.find(p => p.tier === tierB);
      if (!planA || !planB) return { onlyInA: [], onlyInB: [], shared: [] };

      const setA = new Set(planA.features);
      const setB = new Set(planB.features);
      return {
        onlyInA: planA.features.filter(f => !setB.has(f)),
        onlyInB: planB.features.filter(f => !setA.has(f)),
        shared: planA.features.filter(f => setB.has(f)),
      };
    },

    /**
     * Lay plan limits cho tier
     */
    getPlanLimits(tier: PlanTier): PlanLimits | null {
      const plan = plans.find(p => p.tier === tier);
      return plan?.limits ?? null;
    },
  };
}

// ─── Checkout Hook ──────────────────────────────────────────────

export type CheckoutStep = 'plan_selection' | 'billing_info' | 'payment' | 'confirmation' | 'error';
export type CheckoutProvider = 'polar' | 'stripe' | 'payos';

export interface CheckoutState {
  step: CheckoutStep;
  plan: PlanTier | null;
  cycle: BillingCycle;
  couponCode: string | null;
  discountAmount: number;
  totalAmount: number;
  isProcessing: boolean;
  error: string | null;
}

export interface CheckoutHookConfig {
  provider: CheckoutProvider;
  successUrl?: string;
  cancelUrl?: string;
  /** Stripe secret key — required when provider='stripe' for native Checkout Session */
  stripeSecretKey?: string;
  /** Map plan tiers to Stripe price IDs for automatic resolution */
  stripePriceMapping?: Record<string, { monthly: string; yearly: string }>;
}

export function createCheckoutHook(config: CheckoutHookConfig) {
  const { provider, successUrl, cancelUrl } = config;

  let state: CheckoutState = {
    step: 'plan_selection',
    plan: null,
    cycle: 'monthly',
    couponCode: null,
    discountAmount: 0,
    totalAmount: 0,
    isProcessing: false,
    error: null,
  };

  return {
    getState: () => ({ ...state }),

    /**
     * Chuyen buoc checkout
     */
    goToStep(step: CheckoutStep): CheckoutState {
      state.step = step;
      state.error = null;
      return { ...state };
    },

    /**
     * Chon plan cho checkout
     */
    selectPlan(plan: PlanTier, cycle: BillingCycle, price: number): CheckoutState {
      state.plan = plan;
      state.cycle = cycle;
      state.totalAmount = price - state.discountAmount;
      state.step = 'billing_info';
      return { ...state };
    },

    /**
     * Apply coupon code
     */
    applyCoupon(code: string, discountPercent: number, basePrice: number): CheckoutState {
      state.couponCode = code;
      state.discountAmount = Math.round(basePrice * (discountPercent / 100));
      state.totalAmount = basePrice - state.discountAmount;
      return { ...state };
    },

    /**
     * Remove coupon
     */
    removeCoupon(basePrice: number): CheckoutState {
      state.couponCode = null;
      state.discountAmount = 0;
      state.totalAmount = basePrice;
      return { ...state };
    },

    /**
     * Build checkout URL cho provider.
     * For Stripe with stripeSecretKey: creates native Checkout Session via API.
     * For others: builds redirect URL with query params.
     */
    buildCheckoutUrl(params: {
      planId: string;
      customerId?: string;
      email?: string;
    }): string {
      const baseUrls: Record<CheckoutProvider, string> = {
        polar: 'https://checkout.polar.sh',
        stripe: 'https://checkout.stripe.com',
        payos: 'https://pay.payos.vn',
      };

      const url = new URL(baseUrls[provider]);
      url.searchParams.set('plan', params.planId);
      if (params.customerId) url.searchParams.set('customer', params.customerId);
      if (params.email) url.searchParams.set('email', params.email);
      if (successUrl) url.searchParams.set('success_url', successUrl);
      if (cancelUrl) url.searchParams.set('cancel_url', cancelUrl);
      if (state.couponCode) url.searchParams.set('coupon', state.couponCode);

      return url.toString();
    },

    /**
     * Create native Stripe Checkout Session (async, server-side).
     * Requires stripeSecretKey in config. Returns session URL for redirect.
     * Use this instead of buildCheckoutUrl for production Stripe integration.
     */
    async createStripeCheckoutSession(params: {
      priceId: string;
      email?: string;
      customerId?: string;
      trialDays?: number;
      metadata?: Record<string, string>;
    }): Promise<{ sessionId: string; url: string } | null> {
      if (provider !== 'stripe' || !config.stripeSecretKey) return null;

      try {
        const { createStripeAdapter } = await import('@agencyos/vibe-stripe');
        const adapter = createStripeAdapter({ secretKey: config.stripeSecretKey });
        const session = await adapter.createCheckoutSession({
          priceId: params.priceId,
          mode: 'subscription',
          customerEmail: params.email,
          customerId: params.customerId,
          trialDays: params.trialDays,
          successUrl: successUrl ?? '/checkout/success',
          cancelUrl: cancelUrl ?? '/checkout/cancel',
          metadata: params.metadata,
        });
        return session;
      } catch {
        return null;
      }
    },

    /**
     * Resolve plan tier + billing cycle to Stripe price ID.
     * Uses stripePriceMapping from config.
     */
    resolveStripePriceId(tier: string, cycle: 'monthly' | 'yearly' = 'monthly'): string | null {
      return config.stripePriceMapping?.[tier]?.[cycle] ?? null;
    },

    /**
     * Set processing state
     */
    setProcessing(processing: boolean): CheckoutState {
      state.isProcessing = processing;
      return { ...state };
    },

    /**
     * Set error
     */
    setError(error: string | null): CheckoutState {
      state.error = error;
      state.isProcessing = false;
      if (error) state.step = 'error';
      return { ...state };
    },
  };
}

// ─── Subscription Management Hook ───────────────────────────────

export type SubscriptionAction = 'upgrade' | 'downgrade' | 'cancel' | 'pause' | 'resume' | 'reactivate';

export interface SubscriptionManagementState {
  currentPlan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'paused' | 'cancelled';
  daysUntilRenewal: number;
  usagePercent: number;
  pendingAction: SubscriptionAction | null;
}

export interface SubscriptionHookConfig {
  trialDays: number;
  gracePeriodDays?: number;
}

export function createSubscriptionHook(config: SubscriptionHookConfig) {
  const { trialDays, gracePeriodDays = 3 } = config;

  return {
    /**
     * Tinh so ngay con lai trong period
     */
    daysUntilRenewal(periodEnd: string): number {
      const end = new Date(periodEnd);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    /**
     * Tinh trial days remaining
     */
    trialDaysRemaining(trialEnd: string): number {
      const end = new Date(trialEnd);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    /**
     * Xac dinh actions kha dung cho subscription hien tai
     */
    availableActions(status: SubscriptionManagementState['status'], currentPlan: PlanTier): SubscriptionAction[] {
      const actions: SubscriptionAction[] = [];

      if (status === 'active' || status === 'trialing') {
        if (currentPlan !== 'enterprise') actions.push('upgrade');
        if (currentPlan !== 'free') actions.push('downgrade');
        actions.push('pause', 'cancel');
      }
      if (status === 'paused') actions.push('resume');
      if (status === 'cancelled') actions.push('reactivate');
      if (status === 'past_due') actions.push('cancel');

      return actions;
    },

    /**
     * Generate cancellation survey options
     */
    getCancelReasons(): { id: string; label: string }[] {
      return [
        { id: 'too_expensive', label: 'Giá quá cao' },
        { id: 'not_using', label: 'Không sử dụng đủ' },
        { id: 'missing_features', label: 'Thiếu tính năng cần thiết' },
        { id: 'found_alternative', label: 'Đã tìm giải pháp khác' },
        { id: 'technical_issues', label: 'Gặp lỗi kỹ thuật' },
        { id: 'temporary', label: 'Tạm dừng, sẽ quay lại' },
        { id: 'other', label: 'Lý do khác' },
      ];
    },

    /**
     * Tinh pause duration toi da (days)
     */
    maxPauseDuration(plan: PlanTier): number {
      const limits: Record<PlanTier, number> = {
        free: 0, starter: 30, growth: 60, premium: 90, master: 120, enterprise: 180,
      };
      return limits[plan];
    },

    /**
     * Check co nen show retention offer khong
     */
    shouldShowRetentionOffer(action: SubscriptionAction, plan: PlanTier): boolean {
      return action === 'cancel' && plan !== 'free';
    },
  };
}

// ─── Invoice Hook ───────────────────────────────────────────────

export interface InvoiceFilter {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
}

export function createInvoiceHook() {
  return {
    /**
     * Format invoice number cho display
     */
    formatInvoiceNumber(number: string): string {
      return number.replace(/^INV-/, '#');
    },

    /**
     * Tinh overdue days
     */
    overdueDays(dueDate: string): number {
      const due = new Date(dueDate);
      const now = new Date();
      const diff = now.getTime() - due.getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    },

    /**
     * Get status badge color
     */
    getStatusColor(status: string): string {
      const colors: Record<string, string> = {
        draft: 'gray',
        sent: 'blue',
        paid: 'green',
        overdue: 'red',
        cancelled: 'gray',
        refunded: 'yellow',
      };
      return colors[status] ?? 'gray';
    },

    /**
     * Filter invoices theo criteria
     */
    filterInvoices<T extends { status: string; issuedAt: string }>(invoices: T[], filter: InvoiceFilter): T[] {
      return invoices.filter(inv => {
        if (filter.status && inv.status !== filter.status) return false;
        if (filter.dateFrom && inv.issuedAt < filter.dateFrom) return false;
        if (filter.dateTo && inv.issuedAt > filter.dateTo) return false;
        return true;
      });
    },

    /**
     * Tinh tong revenue tu invoices
     */
    calculateRevenue<T extends { status: string; total: number }>(invoices: T[]): { total: number; paid: number; outstanding: number } {
      let paid = 0;
      let outstanding = 0;
      for (const inv of invoices) {
        if (inv.status === 'paid') paid += inv.total;
        else if (inv.status === 'sent' || inv.status === 'overdue') outstanding += inv.total;
      }
      return { total: paid + outstanding, paid, outstanding };
    },
  };
}

// ─── Usage Tracking Hook ────────────────────────────────────────

export function createUsageTrackingHook() {
  return {
    /**
     * Format usage percentage cho progress bar
     */
    formatUsageBar(current: number, limit: number | undefined): { percent: number; label: string; color: string } {
      if (!limit) return { percent: 0, label: 'Unlimited', color: 'green' };
      const percent = Math.min(100, Math.round((current / limit) * 100));
      const color = percent >= 90 ? 'red' : percent >= 70 ? 'yellow' : 'green';
      return { percent, label: `${current.toLocaleString()} / ${limit.toLocaleString()}`, color };
    },

    /**
     * Tinh estimated usage cuoi thang
     */
    projectedMonthlyUsage(currentUsage: number, dayOfMonth: number, totalDays: number): number {
      if (dayOfMonth === 0) return 0;
      return Math.round((currentUsage / dayOfMonth) * totalDays);
    },

    /**
     * Check co can canh bao usage spike khong
     */
    detectUsageSpike(recentValues: number[], threshold: number = 2): { spike: boolean; factor: number } {
      if (recentValues.length < 3) return { spike: false, factor: 1 };
      const avg = recentValues.slice(0, -1).reduce((a, b) => a + b, 0) / (recentValues.length - 1);
      const latest = recentValues[recentValues.length - 1];
      const factor = avg > 0 ? latest / avg : 1;
      return { spike: factor >= threshold, factor };
    },
  };
}
