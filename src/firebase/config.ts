
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

// 🔧 Configuración principal de tu proyecto Firebase
export const firebaseConfig = {
  projectId: "studio-8211110745-23a45",
  appId: "1:155720652009:web:b53cfc8b48737a22370c78",
  apiKey: "AIzaSyCpVj0p_OqN1f1CtyZVJSh-LxwNkbyT8nA",
  authDomain: "studio-8211110745-23a45.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "155720652009",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// 🚀 Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 📂 Servicios de Firebase
export const db = getFirestore(app);
export const storage = getStorage(app);

// 👤 Autenticación anónima automática
const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => {
    console.log("✅ Autenticación anónima exitosa");
  })
  .catch((error) => {
    console.error("❌ Error al autenticar anónimamente:", error.message);
  });

export { auth };
