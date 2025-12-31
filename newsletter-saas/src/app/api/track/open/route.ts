import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Transparent 1x1 GIF
const TRACKING_GIF = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
)

// GET /api/track/open - Track email opens
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const issueId = searchParams.get('i')
        const subscriberId = searchParams.get('s')

        if (issueId && subscriberId) {
            // Log the open event
            const supabase = await createClient()

            await supabase.from('newsletter_events').insert({
                issue_id: issueId,
                subscriber_id: subscriberId,
                event_type: 'opened',
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                user_agent: request.headers.get('user-agent'),
            })

            // Update subscriber stats
            await supabase
                .from('newsletter_subscribers')
                .update({
                    opens_count: supabase.rpc('increment', { row_id: subscriberId }),
                    last_opened_at: new Date().toISOString()
                })
                .eq('id', subscriberId)

            // Update issue stats
            await supabase.rpc('increment_issue_opens', { p_issue_id: issueId })
        }

        // Return tracking GIF
        return new NextResponse(TRACKING_GIF, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        })
    } catch (error) {
        console.error('Error tracking open:', error)
        // Still return the GIF even on error
        return new NextResponse(TRACKING_GIF, {
            headers: { 'Content-Type': 'image/gif' },
        })
    }
}
