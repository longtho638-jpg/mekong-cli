import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/track/click - Track link clicks and redirect
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const issueId = searchParams.get('i')
        const subscriberId = searchParams.get('s')
        const targetUrl = searchParams.get('u')

        if (!targetUrl) {
            return NextResponse.redirect('/')
        }

        const decodedUrl = decodeURIComponent(targetUrl)

        if (issueId && subscriberId) {
            // Log the click event
            const supabase = await createClient()

            await supabase.from('newsletter_events').insert({
                issue_id: issueId,
                subscriber_id: subscriberId,
                event_type: 'clicked',
                link_url: decodedUrl,
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                user_agent: request.headers.get('user-agent'),
            })

            // Update subscriber stats
            await supabase
                .from('newsletter_subscribers')
                .update({
                    clicks_count: supabase.rpc('increment', { row_id: subscriberId }),
                    last_clicked_at: new Date().toISOString()
                })
                .eq('id', subscriberId)

            // Update issue stats
            await supabase.rpc('increment_issue_clicks', { p_issue_id: issueId })
        }

        // Redirect to target URL
        return NextResponse.redirect(decodedUrl)
    } catch (error) {
        console.error('Error tracking click:', error)
        // Try to redirect anyway
        const targetUrl = new URL(request.url).searchParams.get('u')
        if (targetUrl) {
            return NextResponse.redirect(decodeURIComponent(targetUrl))
        }
        return NextResponse.redirect('/')
    }
}
