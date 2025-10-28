
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';


export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
           <Image src="/Imagenes/DSK.png" alt="Logo DSK" width={200} height={100} />
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
              <Button type="submit" className="w-full" asChild>
                <Link href="/dashboard">Entrar</Link>
              </Button>
            </div>
            <div className="mt-8 text-center text-xs text-muted-foreground">
              <p className="font-bold">Almera Information Management</p>
              <p>almeraim.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
