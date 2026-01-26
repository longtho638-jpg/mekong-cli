import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  // Forward request to FastAPI backend
  // Note: We need to use 'fetch' in a way that supports streaming response forwarding
  // Ideally we pipe the response.

  const res = await fetch(`${backendUrl}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.body) {
    return NextResponse.json({ error: 'No response body' }, { status: 500 });
  }

  // Pass the stream through
  return new Response(res.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
