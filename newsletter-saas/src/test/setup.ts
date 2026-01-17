import { jest } from "@jest/globals";

// Mock Next.js headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    })),
  })),
}));

// Mock PayPal client
jest.mock("@/lib/paypal/client", () => ({
  createOrder: jest.fn(),
  PAYPAL_PRICES: {
    starter: { monthly: 9, yearly: 90 },
    pro: { monthly: 29, yearly: 290 },
    enterprise: { monthly: 99, yearly: 990 },
  },
}));

// Global test setup
global.Request = Request as any;
global.Response = Response as any;
global.NextRequest = Request as any;
global.NextResponse = Response as any;
