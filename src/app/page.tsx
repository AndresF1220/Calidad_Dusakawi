
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { useFirebase } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
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
    console.log("Login process started...");

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
      // 1. Query Firestore for the user by 'cedula'
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('cedula', '==', cedula));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No user document found for cedula:", cedula);
        toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: 'Cédula o contraseña incorrectos, o el usuario está inactivo.',
        });
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log("User document found:", userData);
      
      // 2. Validate status and tempPassword locally
      if (userData.status !== 'active') {
        console.log("User is inactive.");
        toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: 'El usuario está inactivo.',
        });
        setIsLoading(false);
        return;
      }

      if (userData.tempPassword !== password) {
        console.log("Local password check failed.");
        toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: 'Cédula o contraseña incorrectos, o el usuario está inactivo.',
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Local validation successful. Attempting Firebase Auth sign-in...");
      const auth = getAuth();
      const email = userData.email;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase Auth sign-in successful.");
        router.push('/inicio');

      } catch (error: any) {
        console.error("Firebase Auth error:", error.code, error.message);
        
        // 3. If user not found in Auth, create them
        if (error.code === 'auth/user-not-found') {
          console.log("User not found in Auth, attempting to create...");
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created in Auth successfully.");
            
            // It's crucial to set the document with the new UID
            const userDocRef = doc(firestore, 'users', userCredential.user.uid);
            // Overwrite the old doc with the new UID
            await setDoc(userDocRef, { ...userData, createdAt: serverTimestamp() });
             
            // We don't need to sign in again, createUserWithEmailAndPassword already signs the user in.
            router.push('/inicio');

          } catch (creationError: any) {
             console.error("Error creating user in Auth:", creationError);
             toast({
                variant: 'destructive',
                title: 'Error de Registro Automático',
                description: `No se pudo crear su cuenta: ${creationError.message}`,
             });
          }
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             toast({
                variant: 'destructive',
                title: 'Error de acceso',
                description: 'Cédula o contraseña incorrectos, o el usuario está inactivo.',
             });
        } else {
             toast({
                variant: 'destructive',
                title: 'Error de autenticación',
                description: error.message,
             });
        }
      }

    } catch (error: any) {
      console.error("General login error:", error);
      toast({
          variant: 'destructive',
          title: 'Error de acceso',
          description: 'Ocurrió un error inesperado. Por favor intente de nuevo.',
      });
    } finally {
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
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required disabled={isLoading}/>
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
