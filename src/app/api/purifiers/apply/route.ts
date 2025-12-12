import { NextResponse } from 'next/server';

// POST /api/purifiers/apply { id: string, updates: Record<string, any> }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id as string;
    const updates = body?.updates as Record<string, any>;
    if (!id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ success: false, error: 'Firebase database URL missing' }, { status: 500 });
    }
    // Patch only provided fields
    const resp = await fetch(`${dbUrl}/purifiers/${encodeURIComponent(id)}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ success: false, error: `RTDB write failed: ${resp.status} ${txt}` }, { status: 502 });
    }
    const data = await resp.json();
    return NextResponse.json({ success: true, id, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
