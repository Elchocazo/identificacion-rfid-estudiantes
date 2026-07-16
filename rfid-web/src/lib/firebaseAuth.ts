import { getAuth } from 'firebase-admin/auth';
import './firebaseAdmin';

// We import firebaseAdmin to ensure initializeApp has run
export const adminAuth = new Proxy({}, {
  get(target, prop) {
    const auth = getAuth() as any;
    const value = auth[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
}) as ReturnType<typeof getAuth>;
