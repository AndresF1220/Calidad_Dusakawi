
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: App;

if (getApps().some(app => app.name === 'admin')) {
  adminApp = getApp('admin');
} else if (serviceAccount) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  }, 'admin');
} else {
  // In a Google Cloud environment, the SDK can auto-discover credentials.
  adminApp = initializeApp(undefined, 'admin');
}

export { adminApp };
