import { Resend } from 'resend';

// Safe initialization for build time
const apiKey = process.env.RESEND_API_KEY || 're_123_BUILD_PLACEHOLDER';

export const resend = new Resend(apiKey);

export const EMAIL_SENDER = 'Sa Đéc Flower Hunt <onboarding@resend.dev>'; // Default Resend domain until custom domain verified
export const ADMIN_EMAIL = 'longtho638@gmail.com'; // Replace with actual admin email
