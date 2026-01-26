import { sendWithResend, SendEmailOptions } from './resend';
import { sendWithSendGrid } from './sendgrid';

export async function sendEmail(options: SendEmailOptions) {
  // Try Primary Provider (Resend)
  const resendResult = await sendWithResend(options);

  if (resendResult.success) {
    return resendResult;
  }

  console.warn('Primary provider (Resend) failed, switching to fallback (SendGrid)...');

  // Try Fallback Provider (SendGrid)
  const sendgridResult = await sendWithSendGrid(options);

  if (sendgridResult.success) {
    return sendgridResult;
  }

  // Both failed
  throw new Error('All email providers failed to send email.');
}
