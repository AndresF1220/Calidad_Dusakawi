
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

let adminApp: App;

if (!serviceAccountString) {
  throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada. El Admin SDK no puede funcionar.');
}

const serviceAccount = JSON.parse(serviceAccountString);

// Evitar reinicializar la app en entornos de desarrollo con hot-reloading.
if (!getApps().find(app => app?.name === 'admin')) {
  adminApp = initializeApp({
    credential: cert(serviceAccount)
  }, 'admin');
} else {
  adminApp = getApp('admin');
}

// Exportar la instancia de base de datos del admin.
// Renombrada a adminDb para evitar confusión con la db del cliente.
const db = getFirestore(adminApp);

export { adminApp, db };
