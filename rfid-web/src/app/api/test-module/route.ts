import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const mod = await import('@/lib/firebaseAdmin');
    return NextResponse.json({ success: true, keys: Object.keys(mod) });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
}
