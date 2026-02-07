import { NextRequest, NextResponse } from 'next/server';

// Receives client-side debug payloads and forwards them server-side to the
// local debug ingest endpoint (avoids browser CORS/preflight issues).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // Basic shape guard: only forward plain objects.
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await fetch('http://127.0.0.1:7245/ingest/9b54c50e-7215-42b2-8f27-9665bb816f25', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

