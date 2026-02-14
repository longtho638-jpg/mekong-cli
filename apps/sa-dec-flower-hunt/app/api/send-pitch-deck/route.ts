import { NextRequest, NextResponse } from 'next/server';

// Email sending API for pitch deck delivery
// TODO: Install `resend` package and add RESEND_API_KEY to .env.local
// npm install resend

export async function POST(req: NextRequest) {
    try {
        const { email, name, company } = await req.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Check for Resend API key
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            // Demo mode: log instead of sending
            console.log('📧 [DEMO] Pitch deck request received:');
            console.log(`   To: ${email}`);
            console.log(`   Name: ${name}`);
            console.log(`   Company: ${company || 'N/A'}`);

            return NextResponse.json({
                success: true,
                mode: 'demo',
                message: 'Email logged (RESEND_API_KEY not configured)'
            });
        }

        // Real email sending with Resend
        // const { Resend } = await import('resend');
        // const resend = new Resend(resendApiKey);
        // 
        // await resend.emails.send({
        //     from: 'AGRIOS.tech <noreply@agrios.tech>',
        //     to: email,
        //     subject: 'AGRIOS.tech Pitch Deck - As Requested',
        //     html: `
        //         <h1>Hi ${name},</h1>
        //         <p>Thank you for your interest in AGRIOS.tech!</p>
        //         <p>Please find our pitch deck attached.</p>
        //         <p>Company: ${company || 'Individual investor'}</p>
        //         <p>Best regards,<br>AGRIOS.tech Team</p>
        //     `,
        //     attachments: [
        //         {
        //             filename: 'AGRIOS_Pitch_Deck.pdf',
        //             path: `${process.cwd()}/public/assets/pitch-deck.pdf`
        //         }
        //     ]
        // });

        // For now, just log the request
        console.log('📧 Pitch deck email would be sent to:', email);

        return NextResponse.json({
            success: true,
            mode: 'pending',
            message: 'Resend integration ready - uncomment code when API key is set'
        });

    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}
