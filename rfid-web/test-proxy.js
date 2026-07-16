const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

// Simulate the proxy
let initError = new Error("Mock initialization error");

const adminDb = new Proxy({}, {
  get(target, prop) {
    if (initError) throw initError;
    const db = getFirestore();
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

async function POST() {
  try {
    const studentsRef = adminDb.collection('students');
    console.log("Got studentsRef");
  } catch (error) {
    console.error("Caught error:", error.message);
  }
}

POST();
