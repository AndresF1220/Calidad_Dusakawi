// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpVj0p_OqN1f1CtyZVJSh-lxwNkbvT8nA",
  authDomain: "studio-8211110745-23a45.firebaseapp.com",
  projectId: "studio-8211110745-23a45",
  storageBucket: "studio-8211110745-23a45.appspot.com",
  messagingSenderId: "155720652009",
  appId: "1:155720652009:web:b53cfc8b48737a22370c78"
};

// ❗ Nada de process.env ni otras configs. Usa SOLO esto.
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => console.log("Autenticación anónima OK"))
  .catch((e) => console.error("Error auth anónima:", e.message));
