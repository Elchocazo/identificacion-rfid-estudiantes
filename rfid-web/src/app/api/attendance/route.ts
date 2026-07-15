import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // 1. Buscar si el UID corresponde a algún estudiante registrado
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Tarjeta no registrada: la guardamos en registros pendientes para que el profesor pueda asignarla
      const pendingRef = collection(db, 'pending_registrations');
      await addDoc(pendingRef, {
        uid,
        timestamp: serverTimestamp()
      });
      return NextResponse.json({ error: 'Tarjeta no registrada. Lista para ser asignada en el panel.' }, { status: 404 });
    }

    const studentDoc = querySnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentId = studentDoc.id;

    // 2. Determinar si es Entrada o Salida
    // Buscamos el último registro de asistencia de hoy para este estudiante
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const attendanceRef = collection(db, 'attendance');
    const attQuery = query(
      attendanceRef,
      where('studentId', '==', studentId)
    );
    const attSnapshot = await getDocs(attQuery);
    
    // Simplificación: si el número de registros hoy es par, es Entrada, si es impar es Salida.
    // Filtramos los de hoy en JavaScript para evitar error de índice compuesto en Firebase.
    let type = 'Entrada';
    if (!attSnapshot.empty) {
      const records = attSnapshot.docs
        .map(d => d.data())
        .filter(d => {
          const time = d.timestamp?.toMillis ? d.timestamp.toMillis() : 0;
          return time >= startOfDay.getTime();
        })
        .sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timeB - timeA;
        });

      if (records.length > 0 && records[0].type === 'Entrada') {
        type = 'Salida';
      }
    }

    // 3. Registrar la asistencia
    await addDoc(attendanceRef, {
      studentId,
      uid,
      type,
      timestamp: serverTimestamp(),
      studentName: `${studentData.firstName} ${studentData.lastName}`
    });

    // 4. Evolución de la Mascota y Llegadas Tardes
    let petPoints = studentData.petPoints || 0;
    let petLevel = studentData.petLevel || 1;
    let lateArrivals = studentData.lateArrivals || 0;
    
    petPoints += 10; // 10 puntos por escaneo exitoso
    
    if (petPoints >= 100) {
      petLevel += 1;
      petPoints = 0; // Reiniciar puntos tras subir de nivel
    }

    // Comprobar Llegada Tarde (después de las 7:00 AM hora Bogotá)
    if (type === 'Entrada') {
      const nowBogota = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Bogota"}));
      if (nowBogota.getHours() >= 7) {
        lateArrivals += 1;
        
        // Enviar WhatsApp al llegar a 3 tardes
        if (lateArrivals === 3) {
          try {
            // El usuario pidió que los mensajes le lleguen a su celular 3015085806
            const finalPhone = '573015085806'; 
            const message = encodeURIComponent(`🚨 *Alerta de Colegio Hogar Madre de Dios*\n\nEstimado Coordinador,\nLe informamos que el estudiante *${studentData.firstName} ${studentData.lastName}* ha acumulado su tercera llegada tarde (después de las 7:00 AM).\n\nHora de registro: ${nowBogota.toLocaleTimeString('es-CO')}`);
            const apiKey = process.env.CALLMEBOT_API_KEY || '1538587'; // Clave API del usuario
            
            // Enviamos el mensaje sin esperar a que termine para no bloquear la respuesta de la puerta
            fetch(`https://api.callmebot.com/whatsapp.php?phone=${finalPhone}&text=${message}&apikey=${apiKey}`);
          } catch(e) {
            console.error('Error enviando WhatsApp', e);
          }
        }
      }
    }

    // Actualizar estudiante
    await updateDoc(doc(db, 'students', studentId), {
      petPoints,
      petLevel,
      lateArrivals,
      lastAttendance: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Asistencia registrada', 
      type, 
      student: `${studentData.firstName} ${studentData.lastName}`,
      petLevel,
      lateArrivals
    }, { status: 200 });

  } catch (error) {
    console.error('Error procesando asistencia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
