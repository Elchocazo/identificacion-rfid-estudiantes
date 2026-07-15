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
    const allRecords = attSnapshot.docs.map(d => d.data());
    
    const settingsRef = doc(db, 'settings', 'general');
    const settingsSnap = await getDoc(settingsRef);
    const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
    const currentPeriod = settingsData.currentPeriod ? settingsData.currentPeriod : 1;
    const lateArrivalTimeStr = settingsData.lateArrivalTime || '07:00'; // Default a 07:00
    
    const [lateHour, lateMinute] = lateArrivalTimeStr.split(':').map(Number);

    const nowBogota = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    // Comparar horas y minutos
    let isLate = false;
    if (nowBogota.getHours() > lateHour) {
      isLate = true;
    } else if (nowBogota.getHours() === lateHour && nowBogota.getMinutes() >= lateMinute) {
      isLate = true;
    }
    
    // Simplificación: Eliminamos el concepto de "Salida" por petición del usuario.
    // Todas las lecturas serán "Entrada" para evitar el problema de que a los estudiantes se les olvide.
    // (En una versión final podríamos limitar a 1 entrada por día, pero por ahora lo dejamos libre para que puedas probar el WhatsApp escaneando 3 veces seguidas).
    let type = 'Entrada';

    // 3. Registrar la asistencia
    await addDoc(attendanceRef, {
      studentId,
      uid,
      type: 'Entrada',
      timestamp: serverTimestamp(),
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      studentGrade: studentData.grade || '',
      period: currentPeriod,
      isLate: isLate
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

    // Comprobar Llegadas Tardes en el Periodo Actual
    if (isLate) {
      // Filtrar registros pasados de este estudiante que fueron tarde y en el periodo actual
      const pastLateRecords = allRecords.filter(r => r.period === currentPeriod && r.isLate === true);
      
      const totalLateInPeriod = pastLateRecords.length + 1; // +1 por la llegada de hoy
      lateArrivals = totalLateInPeriod; // Actualizamos el número de llegadas tardes en el doc del estudiante (informativo)
      
      // Enviar WhatsApp al llegar a 3 tardes en el periodo
      if (totalLateInPeriod === 3) {
        try {
          const datesList = [...pastLateRecords.map(r => r.timestamp?.toMillis ? new Date(r.timestamp.toMillis()) : nowBogota)];
          datesList.push(nowBogota); // añadir la llegada actual
          
          datesList.sort((a, b) => a.getTime() - b.getTime()); // ordenar cronológicamente
          
          const formattedDates = datesList.map((d, i) => `${i + 1}. ${d.toLocaleDateString('es-CO')} a las ${d.toLocaleTimeString('es-CO')}`).join('\n');

          const finalPhone = '573015085806'; 
          const message = encodeURIComponent(`🚨 *Alerta de Colegio*\n\nEstimado Coordinador,\nLe informamos que el estudiante *${studentData.firstName} ${studentData.lastName}* ha acumulado su tercera llegada tarde en el Periodo ${currentPeriod}.\n\n*Historial de llegadas:*\n${formattedDates}`);
          const apiKey = process.env.CALLMEBOT_API_KEY || '1538587';
          
          fetch(`https://api.callmebot.com/whatsapp.php?phone=${finalPhone}&text=${message}&apikey=${apiKey}`);
        } catch(e) {
          console.error('Error enviando WhatsApp', e);
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
