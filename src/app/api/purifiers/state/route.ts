import { NextResponse } from 'next/server';

// GET /api/purifiers/state?id=MHXY_001
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || 'MHXY_001';
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ success: false, error: 'Firebase database URL missing' }, { status: 500 });
    }
    const resp = await fetch(`${dbUrl}/purifiers/${encodeURIComponent(id)}.json`, { cache: 'no-store' });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ success: false, error: `RTDB error: ${resp.status} ${txt}` }, { status: 502 });
    }
    const data = await resp.json();
    return NextResponse.json({ success: true, id, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
