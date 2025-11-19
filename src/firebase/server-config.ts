
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function initializeServerApp(): App {
  if (getApps().length) {
    return getApp();
  }
  // This will use the GOOGLE_APPLICATION_CREDENTIALS env var
  return initializeApp();
}

const serverApp = initializeServerApp();

export const db = getFirestore(serverApp);
export const storage = getStorage(serverApp);
