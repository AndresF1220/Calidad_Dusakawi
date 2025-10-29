
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    } catch (error: any) {
        console.error("Anonymous sign-in failed:", error);
        alert(`El inicio de sesión anónimo ha fallado: ${error.message}. Por favor, asegúrese de que el proveedor de inicio de sesión 'Anónimo' esté habilitado en su consola de Firebase.`);
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
