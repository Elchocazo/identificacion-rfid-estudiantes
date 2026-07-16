import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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

    if (!uid || !parentId || !schoolId) {
      return NextResponse.json({ error: 'UID, Parent ID y School ID son requeridos' }, { status: 400 });
    }

    // 1. Crear el usuario del padre en Firebase Auth
    const parentEmail = `${parentId}@${schoolId.toLowerCase()}.parent.school.com`;
    let parentPassword = parentId;
    if (parentPassword.length < 6) parentPassword += "000000";

    const auth = getAuth();
    try {
      await createUserWithEmailAndPassword(auth, parentEmail, parentPassword);
    } catch (authError: any) {
      if (authError.code !== 'auth/email-already-in-use') throw authError;
    }

    // 1.5 Crear el usuario del estudiante en Firebase Auth
    const studentEmail = `${idNumber}@${schoolId.toLowerCase()}.student.school.com`;
    let studentPassword = idNumber;
    if (studentPassword.length < 6) studentPassword += "000000";

    try {
      await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
    } catch (authError: any) {
      if (authError.code !== 'auth/email-already-in-use') throw authError;
    }

    // 2. Guardar el estudiante en Firestore
    const studentsRef = collection(db, 'students');
    const newStudent = await addDoc(studentsRef, {
      uid,
      idNumber, // Tarjeta de identidad del estudiante
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      grade,
      birthday,
      photoUrl: photoUrl || 'https://via.placeholder.com/150', // placeholder si no hay foto
      parentPhone,
      parentName,
      parentId,
      petLevel: 1,
      petPoints: 0,
      createdAt: serverTimestamp(),
      schoolId
    });

    // 3. Borrar de pending_registrations
    if (pendingId) {
      await deleteDoc(doc(db, 'pending_registrations', pendingId));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Estudiante registrado correctamente', 
      studentId: newStudent.id,
      parentPassword: parentPassword // Devuelve la contraseña asignada por si se necesita
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error registrando estudiante:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
