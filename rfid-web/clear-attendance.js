require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || '';
privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function cleanAttendance() {
  console.log("=== Limpiando Asistencias ===");
  const attendances = await db.collection('attendance').get();
  for (const a of attendances.docs) {
    console.log(`Borrando Asistencia doc: ${a.id}`);
    await a.ref.delete();
  }

  console.log("=== Reiniciando contadores en Estudiantes ===");
  const students = await db.collection('students').get();
  for (const s of students.docs) {
    console.log(`Reiniciando tarde de: ${s.id}`);
    await s.ref.update({
      lateArrivals: 0,
      petPoints: 0,
      petLevel: 1,
      lastAttendance: null
    });
  }

  console.log("¡Asistencias borradas y estudiantes reiniciados!");
}

cleanAttendance().catch(console.error);
