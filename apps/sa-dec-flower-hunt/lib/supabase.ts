import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Legacy Helper for checking config
export const isSupabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton Client for Client Components
export const supabase = isSupabaseConfigured
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    : undefined;

// Fix #6: Remove DB Mock Fallback
export function createClient(cookieStore?: any) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is required based on Security Audit Fix #6');
    }

    if (!key) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required based on Security Audit Fix #6');
    }

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore ? cookieStore.getAll() : [];
            },
            setAll(cookiesToSet) {
                if (cookieStore) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // unexpected error
                    }
                }
            },
        },
    });
}
