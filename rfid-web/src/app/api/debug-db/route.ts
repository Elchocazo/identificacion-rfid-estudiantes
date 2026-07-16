import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const studentsRef = adminDb.collection('students');
    const querySnapshot = await studentsRef.limit(1).get();
    return NextResponse.json({
      success: true,
      count: querySnapshot.size
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
