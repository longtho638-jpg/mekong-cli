import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendWithResend({
  to,
  subject,
  html,
  from = 'Antigravity <noreply@antigravity.dev>',
  replyTo
}: SendEmailOptions) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      reply_to: replyTo,
    });
    return { success: true, provider: 'resend', id: data.data?.id };
  } catch (error) {
    console.error('Resend Error:', error);
    return { success: false, provider: 'resend', error };
  }
}
