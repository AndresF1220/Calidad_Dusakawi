
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useEffect, useRef, useState } from 'react';
import { useFirebase } from '@/firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, User } from 'lucide-react';
import { useActionState } from 'react';
import { loginAction } from './actions';
import { cn } from '@/lib/utils';

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
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    const handleLoginFlow = async () => {
        const auth = getAuth();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const password = formData.get("password") as string;
        
        if (state.status === "error") {
            if (state.data?.email && password) {
                 try {
                    await signInWithEmailAndPassword(auth, state.data.email, password);
                    router.push('/inicio');
                 } catch (directAuthError: any) {
                     toast({
                         variant: 'destructive',
                         title: 'Error de acceso',
                         description: state.error,
                     });
                 }
            } else {
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
          await signInWithEmailAndPassword(auth, email, tempPassword);
          router.push('/inicio');
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            try {
              if (!firestore) {
                  throw new Error("Firestore not available for user creation.");
              }
              const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
              
              const userDocRef = doc(firestore, 'users', userCredential.user.uid);
              await setDoc(userDocRef, { 
                  email: email, 
                  tempPassword: tempPassword,
                  createdAt: serverTimestamp(),
               }, { merge: true });
              
              router.push('/inicio');
            } catch (creationError: any) {
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
           <div className="relative h-64 w-64 rounded-full overflow-hidden border shadow-md bg-white flex items-center justify-center">
            <Image
                src="/Imagenes/Logo Atlas.png"
                alt="Logo Atlas SGI"
                width={256}
                height={256}
                className="object-contain"
                priority
            />
           </div>
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
              <div className="grid gap-8">
                <div className="relative">
                  <Input
                    id="cedula"
                    name="cedula"
                    type="text"
                    required
                    disabled={isPending}
                    className="peer h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 pt-4"
                    placeholder=" "
                  />
                  <Label
                    htmlFor="cedula"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:bg-card peer-focus:px-1 peer-focus:text-xs peer-focus:text-primary peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:bg-card peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-primary pointer-events-none"
                  >
                    Número de identificación
                  </Label>
                  <User className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isPending}
                    className="peer h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 pt-4"
                    placeholder=" "
                  />
                  <Label
                    htmlFor="password"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:bg-card peer-focus:px-1 peer-focus:text-xs peer-focus:text-primary peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:bg-card peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-primary pointer-events-none"
                  >
                    Contraseña
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isPending}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <Button type="submit" className="w-full mt-2" disabled={isPending}>
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
