require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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
const auth = getAuth();

async function clean() {
  console.log("=== Limpiando Auth ===");
  const authUsers = await auth.listUsers();
  for (const u of authUsers.users) {
    if (!u.email.startsWith('1061768991')) {
      console.log(`Borrando Auth User: ${u.email}`);
      await auth.deleteUser(u.uid);
    } else {
      console.log(`Manteniendo Auth User: ${u.email} (${u.uid})`);
      if (u.email.includes('admin.school.com')) {
        console.log("Restaurando rol admin para: " + u.uid);
        await db.collection('user_roles').doc(u.uid).set({
          role: 'admin',
          schoolCode: 'CHMD'
        });
      }
    }
  }

  console.log("\n=== Limpiando Students ===");
  const students = await db.collection('students').get();
  for (const s of students.docs) {
    console.log(`Borrando Student doc: ${s.id}`);
    await s.ref.delete();
  }

  console.log("\n=== Limpiando Teachers ===");
  const teachers = await db.collection('teachers').get();
  for (const t of teachers.docs) {
    console.log(`Borrando Teacher doc: ${t.id}`);
    await t.ref.delete();
  }
  
  console.log("\n=== Limpiando User Roles (Excepto 1061768991) ===");
  const roles = await db.collection('user_roles').get();
  for (const r of roles.docs) {
    const authUser = authUsers.users.find(u => u.uid === r.id);
    if (!authUser || !authUser.email.startsWith('1061768991')) {
      console.log(`Borrando rol doc: ${r.id}`);
      await r.ref.delete();
    }
  }
  
  console.log("Base de datos limpia!");
}

clean().catch(console.error);
