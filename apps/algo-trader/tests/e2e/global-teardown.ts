/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Global Teardown for E2E Tests
 *
 * Runs once after all tests:
 * - Cleanup test data in database
 * - Delete test Stripe/Polar customers
 * - Remove test fixtures
 */

import { FullConfig } from '@playwright/test';
import Stripe from 'stripe';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Global E2E Test Teardown Started');

  // Cleanup Stripe test environment
  const testCustomerId = process.env.TEST_STRIPE_CUSTOMER_ID;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (stripeSecretKey && testCustomerId) {
    try {
      const stripe = new Stripe(stripeSecretKey);

      // Delete test customer
      await stripe.customers.del(testCustomerId);
      console.log(`✅ Stripe test customer deleted: ${testCustomerId}`);
    } catch (error) {
      console.warn('⚠️ Stripe teardown failed:', error);
    }
  }

  // Cleanup Polar test environment
  // Polar cleanup would go here

  console.log('🎉 Global E2E Test Teardown Complete');
}

export default globalTeardown;
