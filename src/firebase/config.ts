
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// 🔧 Configuración principal de tu proyecto Firebase
// Se han codificado los valores para evitar problemas con las variables de entorno.
export const firebaseConfig = {
  apiKey: "AIzaSyA_mGq-z_0t_t5g_z6r_x7y_z8t_x9y_z-w",
  authDomain: "studio-8211110745-23a45.firebaseapp.com",
  projectId: "studio-8211110745-23a45",
  storageBucket: "studio-8211110745-23a45.appspot.com",
  messagingSenderId: "8211110745",
  appId: "1:8211110745:web:a1b2c3d4e5f6a7b8c9d0e1"
};


// 🚀 Inicializa Firebase de forma segura para evitar duplicados
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 📂 Servicios de Firebase
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
