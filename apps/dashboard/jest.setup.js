/* eslint-env node */
/* global Request, Response, process */
// Jest setup for dashboard tests

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.STRIPE_SECRET_KEY = 'test-stripe-key'

// Mock global Request/Response
global.Request = Request
global.Response = Response
