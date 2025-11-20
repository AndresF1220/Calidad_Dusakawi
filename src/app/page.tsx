'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { useFirebase } from '@/firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo conectar a la base de datos.',
      });
      setIsLoading(false);
      return;
    }
    
    const formData = new FormData(event.currentTarget);
    const cedula = formData.get('cedula') as string;
    const password = formData.get('password') as string;

    try {
      // 1. Find user by cedula and status
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('cedula', '==', cedula), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: 'Cédula o contraseña incorrectos, o el usuario está inactivo.',
        });
        setIsLoading(false);
        return;
      }

      // 2. Get user's email and sign in with Firebase Auth
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;
      
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      
      // 3. Redirect on success
      router.push('/inicio');

    } catch (error: any) {
      console.error("Authentication failed:", error);
      let errorMessage = 'Cédula o contraseña incorrectos, o el usuario está inactivo.';
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          errorMessage = 'Cédula o contraseña incorrectos, o el usuario está inactivo.';
      }

      toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: errorMessage,
      });
      setIsLoading(false);
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
              style={{ width: "auto", height: "auto" }}
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
            <form onSubmit={handleLogin}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="cedula">Número de identificación</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    type="text"
                    placeholder="Escriba su cédula"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
