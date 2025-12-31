import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AnalyticsParams {
    params: Promise<{ id: string }>
}

// GET /api/analytics/[id] - Get analytics for a newsletter or issue
export async function GET(
    request: NextRequest,
    { params }: AnalyticsParams
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'newsletter' // 'newsletter' or 'issue'
        const period = searchParams.get('period') || '30d' // '7d', '30d', '90d', 'all'

        const supabase = await createClient()

        // Calculate date range
        const now = new Date()
        let startDate: Date
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(0)
        }

        if (type === 'newsletter') {
            // Get newsletter analytics
            const { data: newsletter } = await supabase
                .from('newsletters')
                .select('id, name, subscriber_count')
                .eq('id', id)
                .single()

            if (!newsletter) {
                return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
            }

            // Get issues in period
            const { data: issues } = await supabase
                .from('newsletter_issues')
                .select('id, subject, sent_at, recipients_count, opens_count, clicks_count, open_rate, click_rate')
                .eq('newsletter_id', id)
                .eq('status', 'sent')
                .gte('sent_at', startDate.toISOString())
                .order('sent_at', { ascending: false })

            // Get subscriber growth
            const { data: subscribers } = await supabase
                .from('newsletter_subscribers')
                .select('subscribed_at, status')
                .eq('newsletter_id', id)
                .gte('subscribed_at', startDate.toISOString())

            // Calculate metrics
            const totalSent = issues?.reduce((sum, i) => sum + (i.recipients_count || 0), 0) || 0
            const totalOpens = issues?.reduce((sum, i) => sum + (i.opens_count || 0), 0) || 0
            const totalClicks = issues?.reduce((sum, i) => sum + (i.clicks_count || 0), 0) || 0

            const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0
            const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0

            const newSubscribers = subscribers?.filter(s => s.status === 'active').length || 0
            const unsubscribed = subscribers?.filter(s => s.status === 'unsubscribed').length || 0

            return NextResponse.json({
                newsletter: {
                    id: newsletter.id,
                    name: newsletter.name,
                    subscriber_count: newsletter.subscriber_count,
                },
                period,
                metrics: {
                    issues_sent: issues?.length || 0,
                    emails_sent: totalSent,
                    total_opens: totalOpens,
                    total_clicks: totalClicks,
                    avg_open_rate: avgOpenRate.toFixed(1),
                    avg_click_rate: avgClickRate.toFixed(1),
                    new_subscribers: newSubscribers,
                    unsubscribed,
                    net_growth: newSubscribers - unsubscribed,
                },
                issues: issues?.slice(0, 10) || [],
            })
        } else {
            // Get issue analytics
            const { data: issue } = await supabase
                .from('newsletter_issues')
                .select('*')
                .eq('id', id)
                .single()

            if (!issue) {
                return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
            }

            // Get events breakdown
            const { data: events } = await supabase
                .from('newsletter_events')
                .select('event_type, created_at')
                .eq('issue_id', id)

            // Get top clicked links
            const { data: clicks } = await supabase
                .from('newsletter_events')
                .select('link_url')
                .eq('issue_id', id)
                .eq('event_type', 'clicked')

            // Count clicks per link
            const linkCounts: Record<string, number> = {}
            clicks?.forEach(c => {
                if (c.link_url) {
                    linkCounts[c.link_url] = (linkCounts[c.link_url] || 0) + 1
                }
            })

            const topLinks = Object.entries(linkCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([url, count]) => ({ url, clicks: count }))

            return NextResponse.json({
                issue: {
                    id: issue.id,
                    subject: issue.subject,
                    sent_at: issue.sent_at,
                    status: issue.status,
                },
                metrics: {
                    recipients: issue.recipients_count,
                    opens: issue.opens_count,
                    clicks: issue.clicks_count,
                    open_rate: issue.open_rate ? (issue.open_rate * 100).toFixed(1) : '0',
                    click_rate: issue.click_rate ? (issue.click_rate * 100).toFixed(1) : '0',
                },
                top_links: topLinks,
                events_timeline: events?.slice(0, 100) || [],
            })
        }
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}
