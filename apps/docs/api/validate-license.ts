import type { VercelRequest, VercelResponse } from '@vercel/node';

// Demo licenses store (in production, query Supabase)
// This will be populated by the webhook handler
const validLicenses: Record<string, any> = {
    // Demo license for testing
    'AGENCYOS-DEMO-TEST-1234': {
        email: 'demo@agencyos.network',
        plan: 'pro',
        status: 'active',
        created_at: '2024-12-23T00:00:00Z'
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow GET and POST
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get license key from query or body
        const licenseKey = req.query.key || req.body?.key || req.query.license_key || req.body?.license_key;

        if (!licenseKey || typeof licenseKey !== 'string') {
            return res.status(400).json({
                valid: false,
                error: 'License key required'
            });
        }

        // Check format
        const keyPattern = /^AGENCYOS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!keyPattern.test(licenseKey)) {
            return res.status(400).json({
                valid: false,
                error: 'Invalid license key format'
            });
        }

        // In production, query Supabase:
        // const { data, error } = await supabase
        //   .from('licenses')
        //   .select('*')
        //   .eq('license_key', licenseKey)
        //   .single();

        // For demo, check in-memory store
        const license = validLicenses[licenseKey];

        if (!license) {
            // For demo purposes, accept any properly formatted key
            // In production, this would return invalid
            if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
                return res.status(200).json({
                    valid: true,
                    demo: true,
                    plan: 'pro',
                    message: 'Demo mode - key accepted'
                });
            }

            return res.status(404).json({
                valid: false,
                error: 'License key not found'
            });
        }

        // Check if license is active
        if (license.status !== 'active') {
            return res.status(403).json({
                valid: false,
                error: 'License is not active',
                status: license.status
            });
        }

        // Check expiration (if applicable)
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return res.status(403).json({
                valid: false,
                error: 'License has expired',
                expires_at: license.expires_at
            });
        }

        // License is valid
        return res.status(200).json({
            valid: true,
            plan: license.plan,
            email: license.email,
            activated_at: license.activated_at || license.created_at,
            expires_at: license.expires_at
        });

    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            valid: false,
            error: 'Internal server error'
        });
    }
}
