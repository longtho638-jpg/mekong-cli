"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

// Initialize Stripe with your publishable key
// Ideally this should be in an environment variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const useStripe = () => {
  return stripePromise;
};

export const useStripePromise = () => stripePromise;
