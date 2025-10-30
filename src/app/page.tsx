'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import { useFirebaseApp } from '@/firebase';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const app = useFirebaseApp();
  const router = useRouter();

  const handleLogin = async () => {
    const auth = getAuth(app);
    try {
      // For now, we'll use anonymous sign-in as it's enabled.
      await signInAnonymously(auth);
      router.push('/inicio');
    } catch (error: any) {
        console.error("Authentication failed:", error);
        alert(`El inicio de sesión falló: ${error.message}. Por favor, asegúrese de que el proveedor de inicio de sesión 'Anónimo' o 'Correo electrónico/Contraseña' esté habilitado en su consola de Firebase.`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
           <Image 
              src="/Imagenes/DSK.png" 
              alt="Logo DSK" 
              width={300} 
              height={150}
              priority 
            />
        </div>
        <Card className="w-full border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Bienvenido</CardTitle>
            <CardDescription>
              Ingrese a Quality Central para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" />
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
