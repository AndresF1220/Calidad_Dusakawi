
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// 🔧 Configuración principal de tu proyecto Firebase
// Se han codificado los valores para evitar problemas con las variables de entorno.
export const firebaseConfig = {
  apiKey: "AIzaSyCpVj0p_QqN1f1CtyZVJSh-lxwNkbvT8nA",
  authDomain: "studio-8211110745-23a45.firebaseapp.com",
  projectId: "studio-8211110745-23a45",
  storageBucket: "studio-8211110745-23a45.appspot.com",
  messagingSenderId: "155720652009",
  appId: "1:155720652009:web:b53cfc8b48737a22370c78"
};


// 🚀 Inicializa Firebase de forma segura para evitar duplicados
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 📂 Servicios de Firebase
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
