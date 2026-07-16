import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let initError: any = null;

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || '';

    // Handle both literal string "\n" and actual newlines, and remove carriage returns
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

    if (privateKey && projectId && clientEmail) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      initError = new Error('Faltan variables de entorno para Firebase Admin');
    }
  } catch (error) {
    console.error('Firebase admin init error', error);
    initError = error;
  }
}

export const adminDb = new Proxy({}, {
  get(target, prop) {
    if (initError) throw initError;
    const db = getFirestore() as any;
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
}) as FirebaseFirestore.Firestore;


