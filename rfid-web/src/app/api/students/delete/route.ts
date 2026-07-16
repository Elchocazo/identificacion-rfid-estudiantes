import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Falta el ID del estudiante.' }, { status: 400 });
    }

    // Obtener el documento del estudiante
    const studentDoc = await adminDb.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return NextResponse.json({ success: false, error: 'Estudiante no encontrado.' }, { status: 404 });
    }

    const studentData = studentDoc.data();
    const studentAuthId = studentData?.studentAuthId;

    // 1. Borrar de la colección students
    await adminDb.collection('students').doc(studentId).delete();

    // 2. Borrar su rol para quitarle acceso
    if (studentAuthId) {
      await adminDb.collection('user_roles').doc(studentAuthId).delete();
    }

    // Nota: El usuario en Firebase Auth seguirá existiendo de forma aislada, pero la tarjeta RFID
    // ya quedó libre porque el documento en la colección 'students' fue eliminado.
    
    return NextResponse.json({ success: true, message: 'Estudiante y tarjeta liberados exitosamente.' });
  } catch (error: any) {
    console.error('Error al borrar estudiante:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
