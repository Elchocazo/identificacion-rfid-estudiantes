import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  return NextResponse.json({ ok: true, adminDbIsObject: typeof adminDb === 'object' });
}
