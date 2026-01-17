/**
 * 🏦 Payments Components
 * ======================
 * Export tất cả components thanh toán.
 */

// PayPal SDK v6 (Primary)
export { PayPalCheckout } from './PayPalCheckout'
export { default as PayPalCheckoutDefault } from './PayPalCheckout'

// Braintree (Legacy - kept for backward compatibility)
export { BraintreeCheckout } from './BraintreeCheckout'
export { default as BraintreeCheckoutDefault } from './BraintreeCheckout'
