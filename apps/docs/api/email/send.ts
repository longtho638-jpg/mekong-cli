import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const templates = {
    welcome: (data: { name: string; licenseKey: string; plan: string }) => ({
        subject: '🎉 Welcome to AgencyOS - Your License Inside!',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AgencyOS</title>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #22c55e; font-size: 32px; margin: 0;">🏯 AgencyOS</h1>
            <p style="color: #a1a1aa; margin-top: 8px;">Welcome to the future of agency management</p>
        </div>
        
        <!-- Main Card -->
        <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(245, 158, 11, 0.1)); border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0;">Hello ${data.name || 'there'}! 👋</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">
                Thank you for joining AgencyOS <strong style="color: #22c55e;">${data.plan.toUpperCase()}</strong>! 
                Your account is now active and ready to transform how you run your agency.
            </p>
            
            <!-- License Key Box -->
            <div style="background: #18181b; border: 2px dashed #22c55e; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your License Key</p>
                <p style="color: #22c55e; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">${data.licenseKey}</p>
            </div>
            
            <!-- Quick Start -->
            <h3 style="color: #ffffff; margin: 24px 0 16px 0;">🚀 Quick Start</h3>
            <ul style="color: #a1a1aa; padding-left: 20px; line-height: 1.8;">
                <li>Access 125+ AI-powered commands</li>
                <li>Generate proposals, contracts, content in seconds</li>
                <li>Track finances, clients, and projects</li>
            </ul>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 32px;">
                <a href="https://agencyos.network/docs" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Get Started →
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #52525b; font-size: 12px;">
            <p>Need help? Reply to this email or visit our <a href="https://agencyos.network/docs" style="color: #22c55e;">documentation</a>.</p>
            <p>© 2024 AgencyOS. Built with 🏯 Binh Pháp.</p>
        </div>
    </div>
</body>
</html>
        `,
    }),

    onboardingDay1: (data: { name: string }) => ({
        subject: '🚀 Your first AgencyOS command',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #22c55e; font-size: 24px; margin: 0;">🏯 AgencyOS</h1>
        </div>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0;">Hey ${data.name || 'there'}! 👋</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">
                Ready to save your first hour today? Let's try your first command!
            </p>
            
            <!-- Command Box -->
            <div style="background: #0a0a0a; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px 0;">TRY THIS COMMAND</p>
                <code style="color: #22c55e; font-size: 18px; font-family: monospace;">/generate proposal</code>
                <p style="color: #71717a; font-size: 14px; margin: 12px 0 0 0;">
                    Creates a professional proposal from a brief description
                </p>
            </div>
            
            <p style="color: #a1a1aa; line-height: 1.6;">
                Just describe your project; AgencyOS handles the rest. No templates needed.
            </p>
            
            <div style="text-align: center; margin-top: 24px;">
                <a href="https://agencyos.network/docs/commands/proposal" style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                    See How It Works →
                </a>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #52525b; font-size: 12px;">
            <p>More tips coming in 2 days!</p>
        </div>
    </div>
</body>
</html>
        `,
    }),

    onboardingDay3: (data: { name: string }) => ({
        subject: '⚡ 5 commands that save 10+ hours/week',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #22c55e; font-size: 24px; margin: 0;">🏯 AgencyOS</h1>
        </div>
        
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0;">Power User Mode ⚡</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">
                Here are the top 5 commands our most successful agencies use daily:
            </p>
            
            <div style="margin: 24px 0;">
                <div style="border-left: 3px solid #22c55e; padding-left: 16px; margin-bottom: 16px;">
                    <code style="color: #22c55e;">/generate contract</code>
                    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Professional contracts in 30 seconds</p>
                </div>
                <div style="border-left: 3px solid #f59e0b; padding-left: 16px; margin-bottom: 16px;">
                    <code style="color: #f59e0b;">/finance report</code>
                    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Instant financial summaries</p>
                </div>
                <div style="border-left: 3px solid #3b82f6; padding-left: 16px; margin-bottom: 16px;">
                    <code style="color: #3b82f6;">/content calendar</code>
                    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Plan a month of content</p>
                </div>
                <div style="border-left: 3px solid #ec4899; padding-left: 16px; margin-bottom: 16px;">
                    <code style="color: #ec4899;">/client onboard</code>
                    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Automated welcome sequences</p>
                </div>
                <div style="border-left: 3px solid #8b5cf6; padding-left: 16px;">
                    <code style="color: #8b5cf6;">/invoice create</code>
                    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Generate and send invoices</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 24px;">
                <a href="https://agencyos.network/docs/commands" style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                    View All 125+ Commands →
                </a>
            </div>
        </div>
    </div>
</body>
</html>
        `,
    }),

    onboardingDay7: (data: { name: string; referralCode?: string }) => ({
        subject: '💰 Earn 40% referring agencies',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #22c55e; font-size: 24px; margin: 0;">🏯 AgencyOS</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(34, 197, 94, 0.1)); border: 1px solid #f59e0b; border-radius: 16px; padding: 32px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0;">Unlock AG Credits 💰</h2>
            <p style="color: #a1a1aa; line-height: 1.6;">
                Know other agencies? Earn <strong style="color: #f59e0b;">40% commission</strong> as AG Credits when they sign up!
            </p>
            
            <div style="background: #18181b; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">Refer Pro Plan ($99)</p>
                <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">+39.6 AGC</p>
                <p style="color: #71717a; font-size: 12px; margin: 8px 0 0 0;">Use credits for your own subscription!</p>
            </div>
            
            <h3 style="color: #ffffff; margin: 24px 0 12px 0;">How it works:</h3>
            <ol style="color: #a1a1aa; padding-left: 20px; line-height: 1.8; margin: 0;">
                <li>Share your unique referral link</li>
                <li>Friend signs up → you earn AGC</li>
                <li>Use AGC to pay for your plan or transfer P2P</li>
            </ol>
            
            <div style="text-align: center; margin-top: 24px;">
                <a href="https://agencyos.network/affiliate" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #22c55e); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                    Get Your Referral Link →
                </a>
            </div>
        </div>
    </div>
</body>
</html>
        `,
    }),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { to, template, data } = req.body;

        if (!to || !template) {
            return res.status(400).json({ error: 'Missing required fields: to, template' });
        }

        const templateFn = templates[template as keyof typeof templates];
        if (!templateFn) {
            return res.status(400).json({
                error: 'Invalid template',
                available: Object.keys(templates)
            });
        }

        const emailContent = templateFn(data || {});

        const { data: result, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'AgencyOS <hello@agencyos.network>',
            to: to,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: 'Failed to send email', details: error });
        }

        return res.json({ success: true, id: result?.id });

    } catch (error: any) {
        console.error('Email send error:', error);
        return res.status(500).json({ error: 'Email send failed', message: error.message });
    }
}
