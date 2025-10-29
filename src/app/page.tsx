
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      await signInAnonymously(auth);
      router.push('/inicio');
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      // Optionally, show an error to the user
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
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input id="password" type="password" required className="bg-white" placeholder="Ingrese su contraseña" />
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
