import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
      console.warn('Missing Firebase Env Vars. Using demo project.');
      initializeApp({ projectId: 'demo-project' });
    }
  } catch (error) {
    console.error('Firebase admin init error', error);
    if (!getApps().length) {
      initializeApp({ projectId: 'demo-project' });
    }
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
