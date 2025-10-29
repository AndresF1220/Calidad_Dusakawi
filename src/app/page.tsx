
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
      // First, try to sign in anonymously as it's the simplest method for dev
      await signInAnonymously(auth);
      router.push('/inicio');
    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
            // This error means anonymous sign-in is not enabled in the Firebase console.
            // As a fallback for development, let's try signing in with a dummy email/password.
            // In a real app, you'd show an error or a proper login form.
            console.warn("Anonymous sign-in is disabled. Falling back to email/password for development.");
            try {
                // NOTE: This is a fallback for development. 
                // Ensure this user exists in your Firebase project or change credentials.
                await signInWithEmailAndPassword(auth, 'admin@dusakawi.com', 'password');
                router.push('/inicio');
            } catch (fallbackError) {
                console.error("Email/password fallback sign-in failed:", fallbackError);
                alert("El inicio de sesión ha fallado. Por favor, habilite el inicio de sesión anónimo o con correo/contraseña en su consola de Firebase.");
            }
        } else {
            console.error("Anonymous sign-in failed:", error);
            alert(`Anonymous sign-in failed: ${error.message}`);
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
