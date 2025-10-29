
'use client';

import { createContext, useContext, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, signInAnonymously } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { useUser as useAuthUser } from './auth/use-user';

// Define the shape of the context data
export interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

// Create the context
export const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

// Create a provider component
export const FirebaseProvider = ({
  children,
  ...value
}: {
  children: React.ReactNode;
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}) => {
  const userState = useAuthUser(value.auth);

  useEffect(() => {
    if (userState.status === 'unauthenticated' && value.auth) {
      signInAnonymously(value.auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [userState.status, value.auth]);


  return (
    <FirebaseContext.Provider value={value}>
      {userState.status === 'loading' ? (
        <div className="flex h-screen items-center justify-center">
          <p>Conectando con Firebase...</p>
        </div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
};

// Create a hook to use the context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
