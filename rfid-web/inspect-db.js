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

async function inspect() {
  const roles = await db.collection('user_roles').get();
  console.log("=== USER ROLES ===");
  roles.docs.forEach(d => console.log(d.id, d.data()));

  const teachers = await db.collection('teachers').get();
  console.log("\n=== TEACHERS ===");
  teachers.docs.forEach(d => console.log(d.id, d.data()));

  const students = await db.collection('students').get();
  console.log("\n=== STUDENTS ===");
  students.docs.forEach(d => console.log(d.id, d.data()));

  console.log("\n=== AUTH USERS ===");
  const authUsers = await getAuth().listUsers();
  authUsers.users.forEach(u => console.log(u.uid, u.email));
}

inspect().catch(console.error);
