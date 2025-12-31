import { NextRequest, NextResponse } from 'next/server'

interface SendEmailRequest {
    issue_id: string
    newsletter_id: string
    subject: string
    html_content: string
    subscribers: Array<{
        id: string
        email: string
        name?: string
    }>
    from_email: string
    from_name: string
    reply_to?: string
}

// POST /api/email/send - Send newsletter to subscribers
export async function POST(request: NextRequest) {
    try {
        // Dynamically import Resend to avoid build-time errors when API key is missing
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        const body: SendEmailRequest = await request.json()

        const {
            issue_id,
            newsletter_id,
            subject,
            html_content,
            subscribers,
            from_email,
            from_name,
            reply_to
        } = body

        if (!subject || !html_content || !subscribers?.length) {
            return NextResponse.json({
                error: 'subject, html_content, and subscribers are required'
            }, { status: 400 })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mekongmail.com'

        // Track results
        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[]
        }

        // Send emails in batches
        const batchSize = 100
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize)

            const emailPromises = batch.map(async (subscriber) => {
                try {
                    // Personalize content
                    let personalizedHtml = html_content
                        .replace(/\{\{name\}\}/g, subscriber.name || 'there')
                        .replace(/\{\{email\}\}/g, subscriber.email)

                    // Add tracking pixel
                    const trackingPixel = `<img src="${appUrl}/api/track/open?i=${issue_id}&s=${subscriber.id}" width="1" height="1" style="display:none" />`
                    personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`)

                    // Wrap links for click tracking
                    personalizedHtml = personalizedHtml.replace(
                        /href="(https?:\/\/[^"]+)"/g,
                        (match, url) => {
                            const trackedUrl = `${appUrl}/api/track/click?i=${issue_id}&s=${subscriber.id}&u=${encodeURIComponent(url)}`
                            return `href="${trackedUrl}"`
                        }
                    )

                    // Add unsubscribe link
                    const unsubscribeUrl = `${appUrl}/unsubscribe?n=${newsletter_id}&s=${subscriber.id}`
                    personalizedHtml = personalizedHtml.replace(
                        '</body>',
                        `<p style="text-align:center;font-size:12px;color:#666;margin-top:20px;">
              <a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Unsubscribe</a>
            </p></body>`
                    )

                    await resend.emails.send({
                        from: `${from_name} <${from_email}>`,
                        to: subscriber.email,
                        subject: subject.replace(/\{\{name\}\}/g, subscriber.name || 'there'),
                        html: personalizedHtml,
                        replyTo: reply_to || from_email,
                        headers: {
                            'List-Unsubscribe': `<${unsubscribeUrl}>`,
                            'X-Newsletter-ID': newsletter_id,
                            'X-Issue-ID': issue_id,
                        }
                    })

                    results.sent++
                } catch (error) {
                    results.failed++
                    results.errors.push(`Failed to send to ${subscriber.email}: ${error}`)
                }
            })

            await Promise.all(emailPromises)
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Sent ${results.sent} emails, ${results.failed} failed`
        })
    } catch (error) {
        console.error('Error sending emails:', error)
        return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
    }
}
