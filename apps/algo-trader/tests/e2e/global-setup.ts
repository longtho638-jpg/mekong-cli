/**
 * Global Setup for E2E Tests
 *
 * Runs once before all tests:
 * - Setup test data in database
 * - Create test Stripe/Polar customers
 * - Initialize test fixtures
 * - Export environment variables
 */

import { FullConfig } from '@playwright/test';
import Stripe from 'stripe';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global E2E Test Setup Started');

  // Setup Stripe test environment
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    try {
      const stripe = new Stripe(stripeSecretKey);

      // Create test customer for all E2E tests
      const testCustomer = await stripe.customers.create({
        email: 'e2e-test@example.com',
        name: 'E2E Test Customer',
        metadata: {
          test_mode: 'true',
          created_by: 'e2e-setup',
        },
      });

      console.log(`✅ Stripe test customer created: ${testCustomer.id}`);
      process.env.TEST_STRIPE_CUSTOMER_ID = testCustomer.id;
    } catch (error) {
      console.warn('⚠️ Stripe setup failed, skipping Stripe tests:', error);
    }
  } else {
    console.log('⚠️ STRIPE_SECRET_KEY not set, skipping Stripe setup');
  }

  // Setup Polar test environment
  const polarApiKey = process.env.POLAR_API_KEY;
  if (polarApiKey) {
    console.log('✅ Polar API key configured');
    // Polar test customer creation would go here
  } else {
    console.log('⚠️ POLAR_API_KEY not set, skipping Polar setup');
  }

  // Verify gateway is reachable
  const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://localhost:8787';
  try {
    const response = await fetch(`${gatewayUrl}/health`);
    if (response.ok) {
      console.log(`✅ RaaS Gateway healthy at ${gatewayUrl}`);
    } else {
      console.warn(`⚠️ RaaS Gateway returned ${response.status}`);
    }
  } catch (error) {
    console.warn(`⚠️ RaaS Gateway not reachable at ${gatewayUrl}`);
  }

  // Verify dashboard is reachable
  const dashboardUrl = process.env.TEST_DASHBOARD_URL || 'http://localhost:3000';
  try {
    const response = await fetch(dashboardUrl);
    if (response.ok) {
      console.log(`✅ AgencyOS Dashboard healthy at ${dashboardUrl}`);
    } else {
      console.warn(`⚠️ Dashboard returned ${response.status}`);
    }
  } catch (error) {
    console.warn(`⚠️ Dashboard not reachable at ${dashboardUrl}`);
  }

  console.log('🎉 Global E2E Test Setup Complete');
}

export default globalSetup;
