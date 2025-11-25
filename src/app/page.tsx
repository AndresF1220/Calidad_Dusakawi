
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { loginAction } from './actions';

const initialState = {
  status: "idle" as "idle" | "success" | "error",
  error: undefined,
  data: undefined,
};

export default function LoginPage() {
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    const handleLoginFlow = async () => {
        const auth = getAuth();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const password = formData.get("password") as string;
        
        if (state.status === "error") {
            if (state.data?.email && password) {
                 // The server-side check failed, but we have an email.
                 // This could mean the user has updated their password in Auth but not in Firestore.
                 // Let's try to sign in with the provided password directly.
                 try {
                    await signInWithEmailAndPassword(auth, state.data.email, password);
                    router.push('/inicio');
                 } catch (directAuthError: any) {
                     // If this also fails, then the credentials are truly wrong.
                     toast({
                         variant: 'destructive',
                         title: 'Error de acceso',
                         description: state.error,
                     });
                 }
            } else {
                // If we don't even have an email from the server action, the user likely doesn't exist.
                toast({
                    variant: 'destructive',
                    title: 'Error de acceso',
                    description: state.error,
                });
            }
        }

      if (state.status === "success" && state.data) {
        const { email, tempPassword } = state.data;
        
        try {
          console.log("Attempting Firebase Auth sign-in...");
          await signInWithEmailAndPassword(auth, email, tempPassword);
          console.log("Firebase Auth sign-in successful.");
          router.push('/inicio');
        } catch (error: any) {
          console.error("Firebase Auth error:", error.code, error.message);
          
          if (error.code === 'auth/user-not-found') {
            console.log("User not found in Auth, attempting to create...");
            try {
              if (!firestore) {
                  throw new Error("Firestore not available for user creation.");
              }
              const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
              console.log("User created in Auth successfully.");
              
              const userDocRef = doc(firestore, 'users', userCredential.user.uid);
              await setDoc(userDocRef, { 
                  email: email, 
                  tempPassword: tempPassword,
                  createdAt: serverTimestamp(),
               }, { merge: true });
              
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
      }
    };

    handleLoginFlow();
  }, [state, router, toast, firestore]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
           <Image 
              src="/Imagenes/Logo Atlas.png" 
              alt="Logo Atlas SGI" 
              width={180} 
              height={100}
              priority
              style={{ width: "auto", height: "auto" }}
            />
        </div>
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Bienvenido</CardTitle>
            <CardDescription>
              Ingrese a Atlas SGI para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form action={formAction} ref={formRef}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="cedula">Número de identificación</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    type="text"
                    placeholder="Escriba su cédula"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required disabled={isPending} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                   {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
