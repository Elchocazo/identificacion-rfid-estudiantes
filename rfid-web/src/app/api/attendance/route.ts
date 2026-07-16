import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { uid, schoolId } = await request.json();

    if (!uid || !schoolId) {
      return NextResponse.json({ error: 'UID y schoolId son requeridos' }, { status: 400 });
    }

    // 1. Buscar si el UID corresponde a algún estudiante registrado en ese colegio
    const studentsRef = adminDb.collection('students');
    const querySnapshot = await studentsRef.where('uid', '==', uid).where('schoolId', '==', schoolId).get();

    if (querySnapshot.empty) {
      // Tarjeta no registrada
      await adminDb.collection('pending_registrations').add({
        uid,
        schoolId,
        timestamp: new Date()
      });
      return NextResponse.json({ error: 'Tarjeta no registrada. Lista para ser asignada en el panel.' }, { status: 404 });
    }

    const studentDoc = querySnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentId = studentDoc.id;

    // Fetch settings to get currentPeriod
    const settingsRef = adminDb.collection('schools').doc(schoolId).collection('settings').doc('general');
    const settingsSnap = await settingsRef.get();
    const settingsData = settingsSnap.exists ? settingsSnap.data() : {};
    const currentPeriod = settingsData?.currentPeriod ? settingsData.currentPeriod : 1;
    const lateArrivalTimeStr = settingsData?.lateArrivalTime || '07:00'; 
    
    const [lateHour, lateMinute] = lateArrivalTimeStr.split(':').map(Number);
    const nowBogota = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Bogota"}));
    
    let isLate = false;
    if (nowBogota.getHours() > lateHour) {
      isLate = true;
    } else if (nowBogota.getHours() === lateHour && nowBogota.getMinutes() >= lateMinute) {
      isLate = true;
    }
    
    // 3. Registrar la asistencia
    await adminDb.collection('attendance').add({
      studentId,
      uid,
      schoolId,
      type: 'Entrada',
      timestamp: new Date(),
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
      // Buscar todas las llegadas tardes de este estudiante en este periodo
      const lateRecordsSnap = await adminDb.collection('attendance')
        .where('studentId', '==', studentId)
        .where('period', '==', currentPeriod)
        .where('isLate', '==', true)
        .get();
        
      const pastLateRecords = lateRecordsSnap.docs.map((d: any) => d.data());
      
      const totalLateInPeriod = pastLateRecords.length; // Ya incluye la de hoy porque acabamos de guardarla
      lateArrivals = totalLateInPeriod; 
      
      // Enviar WhatsApp al llegar a 3 tardes en el periodo
      if (totalLateInPeriod === 3) {
        try {
          const datesList = pastLateRecords.map((r: any) => r.timestamp && r.timestamp.toDate ? r.timestamp.toDate() : nowBogota);
          datesList.sort((a, b) => a.getTime() - b.getTime()); // ordenar cronológicamente
          
          const formattedDates = datesList.map((d: Date, i: number) => `${i + 1}. ${d.toLocaleDateString('es-CO')} a las ${d.toLocaleTimeString('es-CO')}`).join('\n');

          const finalPhone = '573015085806'; 
          const message = encodeURIComponent(`🚨 *Alerta de Colegio*\n\nEstimado Coordinador,\nLe informamos que el estudiante *${studentData.firstName} ${studentData.lastName}* ha acumulado su tercera llegada tarde en el Periodo ${currentPeriod}.\n\n*Historial de llegadas:*\n${formattedDates}`);
          const apiKey = process.env.CALLMEBOT_API_KEY || '1538587';
          
          fetch(`https://api.callmebot.com/whatsapp.php?phone=${finalPhone}&text=${message}&apikey=${apiKey}`);
        } catch(e) {
          console.error('Error enviando WhatsApp', e);
        }
      }
    }

    // Actualizar estudiante usando adminDb
    await adminDb.collection('students').doc(studentId).update({
      petPoints,
      petLevel,
      lateArrivals,
      lastAttendance: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Asistencia registrada', 
      type: 'Entrada', 
      student: `${studentData.firstName} ${studentData.lastName}`,
      petLevel,
      lateArrivals
    }, { status: 200 });

  } catch (error) {
    console.error('Error procesando asistencia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
