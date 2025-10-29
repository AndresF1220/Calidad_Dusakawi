
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import { useFirebaseApp } from '@/firebase';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const app = useFirebaseApp();
  const router = useRouter();

  const handleLogin = async () => {
    const auth = getAuth(app);
    try {
      // First, try to sign in with a dummy email/password as it's a common provider.
      // NOTE: This is a fallback for development. 
      // Ensure this user exists in your Firebase project or change credentials if you have users.
      await signInWithEmailAndPassword(auth, 'admin@dusakawi.com', 'password');
      router.push('/inicio');
    } catch (error: any) {
        // This error means the email/password provider is not enabled in the Firebase console.
        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
            console.warn("Email/Password sign-in is disabled. Falling back to anonymous sign-in for development.");
            try {
                // As a fallback for development, let's try signing in anonymously.
                await signInAnonymously(auth);
                router.push('/inicio');
            } catch (fallbackError: any) {
                 if (fallbackError.code === 'auth/operation-not-allowed' || fallbackError.code === 'auth/admin-restricted-operation') {
                    console.error("All sign-in methods failed:", fallbackError);
                    alert("El inicio de sesión ha fallado. Ni el inicio de sesión con correo/contraseña ni el anónimo están habilitados. Por favor, vaya a su Consola de Firebase -> Authentication -> Sign-in method y habilite al menos uno de estos proveedores para continuar.");
                 } else {
                    console.error("Anonymous sign-in fallback failed:", fallbackError);
                    alert(`El inicio de sesión anónimo ha fallado: ${fallbackError.message}`);
                 }
            }
        } else if (error.code === 'auth/invalid-credential') {
             console.error("Invalid credentials for test user:", error);
             alert("Credenciales inválidas para el usuario de prueba (admin@dusakawi.com). Si ha configurado sus propios usuarios, utilícelos. De lo contrario, asegúrese de que el proveedor de correo electrónico/contraseña esté habilitado en Firebase.");
        } else {
            console.error("Authentication failed:", error);
            alert(`La autenticación ha fallado: ${error.message}`);
        }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
           <Image src="/Imagenes/DSK.png" alt="Logo DSK" width={300} height={150} />
        </div>
        <Card className="w-full border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Usuario</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="bg-white"
                  placeholder="Ingrese su usuario"
                  defaultValue="admin@dusakawi.com"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input id="password" type="password" required className="bg-white" placeholder="Ingrese su contraseña" defaultValue="password" />
              </div>
              <Button type="submit" className="w-full" onClick={handleLogin}>
                Entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
