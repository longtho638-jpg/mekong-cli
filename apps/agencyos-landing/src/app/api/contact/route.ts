import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface ContactSubmission {
  name: string
  email: string
  message: string
  submittedAt: string
}

const SUBMISSIONS_FILE = path.resolve(process.cwd(), 'data/contact-submissions.json')

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

    // Read existing submissions
    let submissions: ContactSubmission[] = []
    try {
      const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf-8')
      submissions = JSON.parse(raw)
    } catch {
      // File doesn't exist yet — start fresh
    }

    submissions.push(submission)

    // Ensure data directory exists
    await fs.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true })
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
