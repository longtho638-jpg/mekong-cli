import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendWithSendGrid({
  to,
  subject,
  html,
  from = 'Antigravity <noreply@antigravity.dev>',
  replyTo
}: SendEmailOptions) {
  try {
    const msg = {
      to,
      from,
      subject,
      html,
      replyTo,
    };

    const [response] = await sgMail.send(msg);
    return { success: true, provider: 'sendgrid', id: response.headers['x-message-id'] };
  } catch (error) {
    console.error('SendGrid Error:', error);
    return { success: false, provider: 'sendgrid', error };
  }
}
