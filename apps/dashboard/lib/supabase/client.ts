 
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Use placeholder values if env vars not set (for deployment)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

    return createBrowserClient(supabaseUrl, supabaseKey)
}
