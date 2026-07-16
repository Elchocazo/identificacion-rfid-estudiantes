const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function test() {
  try {
    initializeApp({ projectId: 'demo-project' });
    console.log('App initialized');
    const adminDb = getFirestore();
    console.log('Firestore initialized');
    await adminDb.collection('students').get();
    console.log('Query success');
  } catch (e) {
    console.error('Query Error:', e.message);
  }
}
test();
