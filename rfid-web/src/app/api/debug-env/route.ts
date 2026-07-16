import { NextResponse } from 'next/server';

export async function GET() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return NextResponse.json({
    projectId: {
      exists: !!projectId,
      length: projectId?.length || 0,
      value: projectId ? `${projectId.substring(0, 3)}...${projectId.slice(-3)}` : null
    },
    clientEmail: {
      exists: !!clientEmail,
      length: clientEmail?.length || 0,
      value: clientEmail ? `${clientEmail.substring(0, 3)}...${clientEmail.slice(-3)}` : null
    },
    privateKey: {
      exists: !!privateKey,
      length: privateKey?.length || 0,
      hasCarriageReturn: privateKey ? privateKey.includes('\r') : false,
      hasLiteralNewlineString: privateKey ? privateKey.includes('\\n') : false,
      hasActualNewline: privateKey ? privateKey.includes('\n') : false,
      start: privateKey ? privateKey.substring(0, 27) : null,
      end: privateKey ? privateKey.slice(-25) : null
    }
  });
}
