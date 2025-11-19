import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

function initializeServerApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // En un entorno de servidor, puedes querer usar credenciales de servicio
  // pero para este entorno, la configuración del cliente puede ser suficiente
  // si el entorno de ejecución tiene los permisos adecuados (ej. en Cloud Run/Functions).
  return initializeApp({
    credential: undefined, // Se usarán las credenciales del entorno de Google
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

const serverApp = initializeServerApp();

export const db = getFirestore(serverApp);
export const storage = getStorage(serverApp);
