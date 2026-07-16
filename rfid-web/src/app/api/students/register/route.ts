import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { adminAuth } from '@/lib/firebaseAuth';

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

    // 1. Crear usuario en Firebase Auth (Para el estudiante)
    const email = `${idNumber}@colegio.com`;
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: email,
        password: idNumber, // Contraseña por defecto es su número de ID
        displayName: `${firstName} ${lastName}`
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Ya existe un usuario con este documento.' }, { status: 400 });
      }
      throw authError;
    }

    // 2. Guardar el rol (student) y el acceso del padre (parent)
    await adminDb.collection('user_roles').doc(userRecord.uid).set({
      role: 'student',
      schoolCode: schoolId
    });

    // 3. Crear el documento del estudiante en Firestore
    await adminDb.collection('students').add({
      uid,
      studentAuthId: userRecord.uid, // ID del estudiante para que pueda iniciar sesión
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
