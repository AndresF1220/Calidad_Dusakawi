
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

let adminApp: App;

// Check if the admin app is already initialized to prevent errors during hot-reloads
if (getApps().some(app => app.name === 'admin')) {
  adminApp = getApp('admin');
} else if (serviceAccountString) {
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    }, 'admin');
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT or initializing admin app:", error);
    // Fallback to a non-functional app instance to avoid crashing the whole server
    // if the env variable is malformed. Errors will occur on operations.
    adminApp = {} as App; 
  }
} else {
  console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set. Firebase Admin SDK will not work.");
  // Fallback for when the env var is missing
  adminApp = {} as App;
}

// Get Firestore instance from the admin app, only if the app was initialized
const db = adminApp.name ? getFirestore(adminApp) : {} as ReturnType<typeof getFirestore>;

export { adminApp, db };
