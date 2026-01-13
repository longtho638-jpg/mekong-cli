import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Cron job to process pending emails from the queue
 * Run every hour via Vercel Cron
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify cron secret (optional security)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow without auth for now, but log
        console.log('Cron running without auth');
    }

    console.log('📧 Processing email queue...');

    try {
        // Get pending emails that are due
        const { data: pendingEmails, error: fetchError } = await supabase
            .from('email_queue')
            .select('*')
            .eq('sent', false)
            .lte('send_at', new Date().toISOString())
            .limit(50);

        if (fetchError) {
            console.error('Failed to fetch queue:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch queue' });
        }

        if (!pendingEmails || pendingEmails.length === 0) {
            console.log('📧 No pending emails');
            return res.json({ processed: 0 });
        }

        console.log(`📧 Found ${pendingEmails.length} pending emails`);

        let processed = 0;
        let failed = 0;

        for (const email of pendingEmails) {
            try {
                // Send email via our API
                const response = await fetch(`${process.env.VERCEL_URL || 'https://agencyos.network'}/api/email/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email.email,
                        template: email.template,
                        data: email.data,
                    }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Mark as sent
                    await supabase
                        .from('email_queue')
                        .update({ sent: true, sent_at: new Date().toISOString() })
                        .eq('id', email.id);

                    processed++;
                    console.log(`✅ Sent ${email.template} to ${email.email}`);
                } else {
                    // Mark error
                    await supabase
                        .from('email_queue')
                        .update({ error: result.error || 'Unknown error' })
                        .eq('id', email.id);

                    failed++;
                    console.error(`❌ Failed ${email.template} to ${email.email}:`, result.error);
                }
            } catch (sendError: any) {
                // Mark error
                await supabase
                    .from('email_queue')
                    .update({ error: sendError.message })
                    .eq('id', email.id);

                failed++;
                console.error(`❌ Error sending to ${email.email}:`, sendError.message);
            }
        }

        console.log(`📧 Queue processed: ${processed} sent, ${failed} failed`);

        return res.json({
            processed,
            failed,
            total: pendingEmails.length,
        });

    } catch (error: any) {
        console.error('Cron error:', error);
        return res.status(500).json({ error: error.message });
    }
}
