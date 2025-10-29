
'use client';
// This is the "barrel" file for the Firebase module.
// It's a single entry point for all Firebase-related functionality.

export { FirebaseClientProvider } from './client-provider';
export {
  FirebaseProvider,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
} from './provider';

// Export hooks for Firestore
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

// Export hooks for Auth
export { useUser } from './auth/use-user';

    