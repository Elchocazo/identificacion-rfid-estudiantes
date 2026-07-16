import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin'; // Solo para inicializar la app

export async function POST(request: Request) {
  try {
    const { targetUid, newPassword } = await request.json();

    if (!targetUid || !newPassword) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    // Usar Firebase Admin para actualizar la contraseña directamente
    const userRecord = await getAuth().updateUser(targetUid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente.', uid: userRecord.uid });
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
