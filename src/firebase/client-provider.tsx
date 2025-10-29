
'use client';

import { useEffect, useState } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseProvider } from './provider';

// This is a client-only provider that will initialize Firebase on the client.
// It will be used in the root layout of the app.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // Basic validation
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        const storage = getStorage(app);

        setApp(app);
        setAuth(auth);
        setFirestore(firestore);
        setStorage(storage);
    }
  }, []);

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore} storage={storage}>
      {children}
    </FirebaseProvider>
  );
}
