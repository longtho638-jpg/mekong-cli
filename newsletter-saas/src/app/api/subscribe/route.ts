import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/subscribe - Public endpoint for newsletter signup
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { newsletter_id, email, name, source = 'form' } = body

        if (!newsletter_id || !email) {
            return NextResponse.json({ error: 'newsletter_id and email required' }, { status: 400 })
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        const supabase = await createClient()

        // Check if newsletter exists
        const { data: newsletter } = await supabase
            .from('newsletters')
            .select('id, name, subscriber_count')
            .eq('id', newsletter_id)
            .single()

        if (!newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id, status')
            .eq('newsletter_id', newsletter_id)
            .eq('email', email)
            .single()

        if (existing) {
            if (existing.status === 'active') {
                return NextResponse.json({
                    success: true,
                    message: 'Already subscribed!',
                    already_subscribed: true
                })
            }

            // Re-subscribe if previously unsubscribed
            await supabase
                .from('newsletter_subscribers')
                .update({ status: 'active', subscribed_at: new Date().toISOString() })
                .eq('id', existing.id)

            return NextResponse.json({
                success: true,
                message: 'Welcome back! You\'ve been re-subscribed.',
                resubscribed: true
            })
        }

        // Create new subscriber
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                newsletter_id,
                email,
                name,
                source,
                status: 'active',
            })

        if (error) {
            if (error.code === '23505') { // Unique constraint
                return NextResponse.json({ success: true, message: 'Already subscribed!' })
            }
            throw error
        }

        // Update subscriber count
        await supabase
            .from('newsletters')
            .update({ subscriber_count: newsletter.subscriber_count + 1 })
            .eq('id', newsletter_id)

        // TODO: Trigger welcome automation if exists

        return NextResponse.json({
            success: true,
            message: `Thanks for subscribing to ${newsletter.name}!`,
            newsletter_name: newsletter.name
        }, { status: 201 })
    } catch (error) {
        console.error('Error subscribing:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
}

// Generate embeddable form HTML
export function generateFormEmbed(newsletterId: string, options: {
    buttonText?: string
    placeholder?: string
    successMessage?: string
    theme?: 'light' | 'dark'
} = {}) {
    const {
        buttonText = 'Subscribe',
        placeholder = 'Enter your email',
        successMessage = 'Thanks for subscribing!',
        theme = 'dark'
    } = options

    const bgColor = theme === 'dark' ? '#1e1e2e' : '#ffffff'
    const textColor = theme === 'dark' ? '#ffffff' : '#000000'
    const buttonBg = '#6366f1'

    return `
<!-- Mekong Mail Signup Form -->
<div id="mm-form-${newsletterId}" style="max-width:400px;font-family:system-ui,sans-serif;">
  <form onsubmit="return mmSubmit(event,'${newsletterId}')" style="display:flex;gap:8px;">
    <input type="email" required placeholder="${placeholder}" id="mm-email-${newsletterId}"
      style="flex:1;padding:12px;border:1px solid #333;border-radius:8px;background:${bgColor};color:${textColor}"/>
    <button type="submit" style="padding:12px 24px;background:${buttonBg};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
      ${buttonText}
    </button>
  </form>
  <p id="mm-msg-${newsletterId}" style="margin-top:8px;font-size:14px;"></p>
</div>
<script>
async function mmSubmit(e,nid){
  e.preventDefault();
  const email=document.getElementById('mm-email-'+nid).value;
  const msg=document.getElementById('mm-msg-'+nid);
  msg.textContent='Subscribing...';
  try{
    const r=await fetch('${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({newsletter_id:nid,email,source:'embed'})
    });
    const d=await r.json();
    msg.textContent=d.success?'${successMessage}':d.error;
    msg.style.color=d.success?'#10b981':'#ef4444';
  }catch(e){msg.textContent='Error. Please try again.';msg.style.color='#ef4444';}
  return false;
}
</script>`
}
