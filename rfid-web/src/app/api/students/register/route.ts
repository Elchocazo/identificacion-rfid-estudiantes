import { NextResponse } from 'next/server';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPxk-FI1hYo3CrACV9NHl7uDgqcxVpHfM",
  authDomain: "identificacion-alumnos-rfid.firebaseapp.com",
  projectId: "identificacion-alumnos-rfid",
  storageBucket: "identificacion-alumnos-rfid.firebasestorage.app",
  messagingSenderId: "204674907895",
  appId: "1:204674907895:web:a5f920c606e6e2d6821df2"
};

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

    // 0. Crear una App de Firebase temporal exclusiva para este request (para no chocar sesiones)
    const tempAppName = `TempApp_${Date.now()}_${Math.random()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const db = getFirestore(getApps()[0]); // Usar la base de datos principal

    let parentPassword = parentId;
    if (parentPassword.length < 6) parentPassword += "000000";

    try {
      // 1. Crear el usuario del padre en Firebase Auth
      const parentEmail = `${parentId}@${schoolId.toLowerCase()}.parent.school.com`;

      try {
        await createUserWithEmailAndPassword(tempAuth, parentEmail, parentPassword);
      } catch (authError: any) {
        if (authError.code !== 'auth/email-already-in-use') throw authError;
      }

      // 1.5 Crear el usuario del estudiante en Firebase Auth
      const studentEmail = `${idNumber}@${schoolId.toLowerCase()}.student.school.com`;
      let studentPassword = idNumber;
      if (studentPassword.length < 6) studentPassword += "000000";

      try {
        await createUserWithEmailAndPassword(tempAuth, studentEmail, studentPassword);
      } catch (authError: any) {
        if (authError.code !== 'auth/email-already-in-use') throw authError;
      }

      // Limpiar la app temporal
      await deleteApp(tempApp);
    } catch (e) {
      await deleteApp(tempApp);
      throw e;
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
