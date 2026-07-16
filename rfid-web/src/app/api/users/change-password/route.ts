import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin'; // Solo para inicializar la app

export async function POST(request: Request) {
  try {
    const { targetUid, newPassword, firestoreStudentId, idNumber, schoolId } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    let uidToUpdate = targetUid;
    let createdAuth = false;

    // Si no enviaron targetUid pero sí datos del estudiante (caso de perfiles antiguos)
    if (!uidToUpdate && firestoreStudentId && idNumber) {
      const email = `${idNumber}@${(schoolId || 'chmd').toLowerCase()}.student.school.com`;
      try {
        // Intentar buscar si el usuario ya existe en Auth por email
        const userRecord = await getAuth().getUserByEmail(email);
        uidToUpdate = userRecord.uid;
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          // El usuario no existe, hay que crearlo
          const newUser = await getAuth().createUser({
            email: email,
            password: newPassword,
          });
          uidToUpdate = newUser.uid;
          createdAuth = true;

          // Guardar su rol
          await adminDb.collection('user_roles').doc(uidToUpdate).set({
            role: 'student',
            schoolCode: schoolId || 'CHMD'
          });
        } else {
          throw e; // Otro error
        }
      }

      // Guardar el authId en el documento del estudiante de Firestore
      await adminDb.collection('students').doc(firestoreStudentId).update({
        studentAuthId: uidToUpdate
      });
    }

    if (!uidToUpdate) {
      return NextResponse.json({ success: false, error: 'No se pudo identificar al usuario.' }, { status: 400 });
    }

    // Si no lo creamos recién (es decir, ya existía), actualizamos la contraseña
    if (!createdAuth) {
      await getAuth().updateUser(uidToUpdate, {
        password: newPassword,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente.', 
      uid: uidToUpdate,
      createdAuth 
    });
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
