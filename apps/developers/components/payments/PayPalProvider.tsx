/**
 * PayPalProvider Component
 *
 * Wraps application with PayPal Script Provider for client-side PayPal integration.
 * Handles PayPal SDK loading and configuration.
 */

"use client";

import React, { ReactNode } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

interface PayPalProviderProps {
  children: ReactNode;
}

// PayPal initial options
const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  currency: "USD",
  intent: "capture",
  // Enable funding sources
  "enable-funding": "venmo,paylater",
  // Disable funding sources (optional)
  // 'disable-funding': 'card',
  // Data attributes for advanced tracking
  "data-partner-attribution-id": "AgencyOS_PCP",
  // Components to load
  components: "buttons,funding-eligibility",
} as const;

/**
 * PayPalProvider component
 *
 * Usage:
 * ```tsx
 * <PayPalProvider>
 *   <YourApp />
 * </PayPalProvider>
 * ```
 */
export function PayPalProvider({ children }: PayPalProviderProps) {
  // Validate client ID before rendering
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error(
      "PayPal Client ID is missing. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your environment.",
    );
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children as React.ReactNode}
    </PayPalScriptProvider>
  );
}

export default PayPalProvider;
