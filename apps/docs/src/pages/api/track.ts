import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { TrackingEvent } from '../../lib/tracking/types';
import crypto from 'crypto';

/**
 * Unified Tracking API Endpoint
 * Handles A/B testing exposures, conversions, engagement, and feedback.
 */

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL || '',
  import.meta.env.SUPABASE_SERVICE_KEY || ''
);

// Simple IP hashing for privacy compliance (Data Diet)
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + (import.meta.env.INTERNAL_API_KEY || 'tracking_salt'))
    .digest('hex')
    .substring(0, 16);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const event: TrackingEvent = await request.json();

    if (!event.type) {
      return new Response(JSON.stringify({ error: 'Missing event type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enhance event with server-side data
    const ipHash = hashIP(clientAddress || request.headers.get('x-forwarded-for') || 'unknown');

    const eventData = {
      ...event,
      ip_hash: ipHash,
      processed_at: new Date().toISOString(),
    };

    // Store in Supabase
    // Note: We use a generic 'tracking_events' table to handle the polymorphic nature of events
    const { error } = await supabase
      .from('tracking_events')
      .insert([eventData]);

    if (error) {
      console.error('Supabase tracking error:', error);
      // We still return 200 to the client to avoid disrupting user experience,
      // but log the error for internal monitoring.
      return new Response(JSON.stringify({ success: false, error: 'Storage failed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Tracking API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
