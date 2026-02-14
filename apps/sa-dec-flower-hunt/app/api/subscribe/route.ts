import { NextResponse } from 'next/server';
import { resend, EMAIL_SENDER, ADMIN_EMAIL } from '@/lib/email';
import WelcomeEmail from '@/emails/WelcomeEmail';

export async function POST(request: Request) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Send Welcome Email to User
        await resend.emails.send({
            from: EMAIL_SENDER,
            to: email, // Valid only if you verify domain or use your own email in test mode
            subject: '🎁 Quà làm quen: Giảm 10% từ Sa Đéc Flower Hunt',
            react: WelcomeEmail({ name: name || 'bạn', discountCode: 'CHAO10' }),
        });

        // 2. Notify Admin (Optional - good for early days)
        // await resend.emails.send({ ... })

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
