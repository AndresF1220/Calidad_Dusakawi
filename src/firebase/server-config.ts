
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

function initializeServerApp(): App {
  // Check if the default app is already initialized
  if (getApps().some(app => app.name === '[DEFAULT]')) {
    return getApp();
  }

  // In a Google Cloud environment (like Firebase App Hosting or Cloud Run),
  // calling initializeApp() with no arguments will automatically use the
  // project's service account credentials.
  return initializeApp({
     storageBucket: firebaseConfig.storageBucket
  });
}

const serverApp = initializeServerApp();

export const db = getFirestore(serverApp);
export const storage = getStorage(serverApp);
