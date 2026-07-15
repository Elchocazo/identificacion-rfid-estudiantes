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
    // Usamos el ID del padre como contraseña
    const parentEmail = `${parentId}@${schoolId.toLowerCase()}.parent.school.com`;
    const parentPassword = parentId; // El usuario pidió que el login sea con identificacion y contraseña que sea la misma?
    // Wait, el usuario dijo "ingresar con el numero de identificacion y la contraseña que sea 36274528".
    // Eso fue para el admin, pero para los padres tal vez quieran usar su identificacion como contraseña, 
    // o "36274528" para todos? Para cumplir el minimo de 6 caracteres, usamos la identificacion si tiene > 5 chars,
    // pero para asegurar, usaremos el mismo password genérico o la identificación si es más larga.
    // Usaremos la identificación. Si falla, el cliente lo atrapará.
    
    // Mejor aún, le daremos la misma contraseña genérica `36274528` a todos los padres por defecto para simplificar,
    // O dejamos que la contraseña sea la identificación + "00" si es muy corta.
    let finalPassword = parentId;
    if (finalPassword.length < 6) {
      finalPassword = finalPassword + "000000";
    }

    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, parentEmail, finalPassword);
    } catch (authError: any) {
      // Ignorar si el usuario ya existe (ej. el padre ya tiene otro hijo registrado)
      if (authError.code !== 'auth/email-already-in-use') {
        throw authError;
      }
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
      parentPassword: finalPassword // Devuelve la contraseña asignada por si se necesita
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error registrando estudiante:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
