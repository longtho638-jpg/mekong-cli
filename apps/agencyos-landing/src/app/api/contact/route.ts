import { NextResponse } from 'next/server'

interface ContactSubmission {
  name: string
  email: string
  message: string
  submittedAt: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    // Email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const submission: ContactSubmission = {
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      message: String(message).slice(0, 2000),
      submittedAt: new Date().toISOString(),
    }

    // TODO: Integrate with Supabase or Resend for persistent storage/email delivery
    // e.g. await supabase.from('contact_submissions').insert(submission)
    // e.g. await resend.emails.send({ to: 'hello@agencyos.network', ... })
    console.log('[contact] new submission', submission)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
