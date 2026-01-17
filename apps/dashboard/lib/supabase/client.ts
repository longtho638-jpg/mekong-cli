import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Validate environment variables are properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
    )
  }

  // Validate Supabase URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    throw new Error('Invalid Supabase URL format. Expected: https://your-project.supabase.co')
  }

  // Validate Supabase key format (should be a JWT)
  if (!supabaseKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anonymous key format. Expected JWT token')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
