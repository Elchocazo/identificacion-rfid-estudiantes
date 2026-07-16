import { getAuth } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // just to init

export async function POST(req: Request) {
  try {
    const { uid, password } = await req.json();
    const user = await getAuth().updateUser(uid, { password });
    return NextResponse.json({ success: true, uid: user.uid });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
