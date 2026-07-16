import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      uid, 
      firstName, 
      lastName, 
      birthday, 
      photoUrl, 
      parentPhone, 
      parentName, 
      parentId, 
      pendingId,
      idNumber,
      grade,
      schoolId
    } = data;

    if (!uid || !firstName || !lastName || !idNumber || !schoolId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Crear usuario en Firebase Auth usando REST API (Para evitar bug de ESM en Vercel)
    const email = `${idNumber}@colegio.com`;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPxk-FI1hYo3CrACV9NHl7uDgqcxVpHfM";
    
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: idNumber,
        returnSecureToken: true
      })
    });
    
    const authData = await authRes.json();
    
    if (!authRes.ok) {
      if (authData.error?.message === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'Ya existe un usuario con este documento.' }, { status: 400 });
      }
      throw new Error(`Auth Error: ${authData.error?.message || 'Unknown'}`);
    }
    
    // Si queremos actualizar el displayName, podríamos hacer otra llamada a setAccountInfo,
    // pero no es estrictamente necesario ya que los datos están en Firestore.
    const uidAuth = authData.localId;

    // 2. Guardar el rol (student) y el acceso del padre (parent)
    await adminDb.collection('user_roles').doc(uidAuth).set({
      role: 'student',
      schoolCode: schoolId
    });

    // 3. Crear el documento del estudiante en Firestore
    await adminDb.collection('students').add({
      uid,
      studentAuthId: uidAuth, // ID del estudiante para que pueda iniciar sesión
      firstName,
      lastName,
      birthday: birthday || '',
      photoUrl: photoUrl || '',
      parentPhone: parentPhone || '',
      parentName: parentName || '',
      parentId: parentId || '',
      idNumber,
      grade,
      schoolId,
      createdAt: new Date()
    });

    // 4. Eliminar el registro pendiente
    if (pendingId) {
      await adminDb.collection('pending_registrations').doc(pendingId).delete();
    }

    return NextResponse.json({ success: true, message: 'Estudiante registrado correctamente' });

  } catch (error: any) {
    console.error('Error completo:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
