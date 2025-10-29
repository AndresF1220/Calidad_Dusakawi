'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { auth, db, storage as firebaseStorage } from './config';

// Singleton instance of Firebase services
let firebaseApp: FirebaseApp;
let firestore: Firestore = db;
let storage: FirebaseStorage = firebaseStorage;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length === 0) {
     throw new Error("Firebase not initialized. Something went wrong in config.ts");
  } else {
    firebaseApp = getApp();
  }

  // Services are already initialized in config.ts, we just re-export them
  // for consistency with the provider structure.
  return { firebaseApp, auth, firestore, storage };
}

export function getSdks(app: FirebaseApp) {
    return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: getFirestore(app),
        storage: getStorage(app),
    };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection.tsx';
export * from './firestore/use-doc.tsx';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';