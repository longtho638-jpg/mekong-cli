import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Generate a unique license key
function generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;

    const parts: string[] = [];
    for (let i = 0; i < segments; i++) {
        let segment = '';
        for (let j = 0; j < segmentLength; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        parts.push(segment);
    }

    return `AGENCYOS-${parts.join('-')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST with authorization
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for API key authorization
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (expectedKey && apiKey !== expectedKey && apiKey !== `Bearer ${expectedKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { email, plan, order_id } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate unique license key
        const licenseKey = generateLicenseKey();

        // Create license record
        const license = {
            license_key: licenseKey,
            email,
            plan: plan || 'pro',
            status: 'active',
            polar_order_id: order_id || null,
            created_at: new Date().toISOString(),
            expires_at: null // Lifetime
        };

        // In production, store in Supabase:
        // const { error } = await supabase.from('licenses').insert(license);

        console.log('Generated license:', { email, plan, licenseKey });

        return res.status(200).json({
            success: true,
            license_key: licenseKey,
            email,
            plan: license.plan,
            created_at: license.created_at
        });

    } catch (error) {
        console.error('Generate key error:', error);
        return res.status(500).json({ error: 'Failed to generate license key' });
    }
}
