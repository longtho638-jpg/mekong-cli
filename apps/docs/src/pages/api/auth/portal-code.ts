// API Endpoint: /api/auth/portal-code
// Purpose: Validate client portal codes
// Method: POST

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || '',
    import.meta.env.SUPABASE_SERVICE_KEY || ''
);

export const POST: APIRoute = async ({ request }) => {
    try {
        // Parse request body
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: 'Missing portal code'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate code format (12 characters alphanumeric)
        if (!/^[A-Z0-9]{12}$/.test(code)) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: 'Invalid code format'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Check if portal code exists and client is active
        const { data: client, error } = await supabase
            .from('clients')
            .select('id, status, created_at')
            .eq('portal_code', code)
            .single();

        if (error || !client) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: 'Invalid or expired portal code'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Check if client is active
        if (client.status !== 'active') {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: 'Client account is inactive'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Calculate expiration (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Success response
        return new Response(
            JSON.stringify({
                valid: true,
                client_id: client.id,
                expires_at: expiresAt.toISOString()
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'private, no-cache' // Don't cache auth responses
                }
            }
        );

    } catch (error) {
        console.error('Auth API Error:', error);

        return new Response(
            JSON.stringify({
                valid: false,
                error: 'Internal server error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};

// OPTIONS handler for CORS preflight
export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
};
