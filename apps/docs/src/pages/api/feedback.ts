import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Feedback Submission API Endpoint
 * Handles user feedback submissions from the FeedbackWidget.
 */

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.SUPABASE_SERVICE_KEY || ''
);

// Simple IP hashing for privacy compliance (Data Diet)
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + (import.meta.env.INTERNAL_API_KEY || 'feedback_salt'))
    .digest('hex')
    .substring(0, 16);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const { category, content, metadata } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Missing feedback content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ipHash = hashIP(clientAddress || request.headers.get('x-forwarded-for') || 'unknown');
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const feedbackData = {
      category: category || 'general',
      content,
      metadata: metadata || {},
      ip_hash: ipHash,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
      source: 'web_widget'
    };

    // Store in Supabase
    const { error } = await supabase
      .from('user_feedback')
      .insert([feedbackData]);

    if (error) {
      console.error('Supabase feedback error:', error);
      return new Response(JSON.stringify({ success: false, error: 'Storage failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Feedback received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Feedback API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
