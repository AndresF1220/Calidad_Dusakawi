
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function initializeServerApp(): App {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp();
}

const serverApp = initializeServerApp();

export const db = getFirestore(serverApp);
export const storage = getStorage(serverApp);
