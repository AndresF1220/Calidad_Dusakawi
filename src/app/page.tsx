
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PlugZap,
  DoorClosed,
  Microwave,
  Lightbulb,
  Droplets,
  Wrench,
  Tv,
  Atom,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

const sustainabilityTips = [
  {
    number: '01',
    text: 'Desconectar cargadores de radio teléfonos, celulares y otros equipos eléctricos que no se estén utilizando.',
    icon: <PlugZap className="h-8 w-8" />,
    position: '-top-4 left-1/2 -translate-x-1/2',
    color: 'text-orange-500',
  },
  {
    number: '02',
    text: 'Mantener cerradas puertas y ventanas durante el tiempo en el que el aire acondicionado esté en funcionamiento.',
    icon: <DoorClosed className="h-8 w-8" />,
    position: 'top-1/4 -left-8',
    color: 'text-pink-500',
  },
  {
    number: '03',
    text: 'Desconecte los electrodomésticos tales como cafeteras y hornos microondas mientras no estén en uso.',
    icon: <Microwave className="h-8 w-8" />,
    position: 'bottom-1/4 -left-8',
    color: 'text-purple-500',
  },
  {
    number: '04',
    text: 'Apagar las luces y aires acondicionados en las horas de descanso, o cuando las áreas estén solas.',
    icon: <Lightbulb className="h-8 w-8" />,
    position: '-bottom-4 left-1/2 -translate-x-1/2',
    color: 'text-blue-500',
  },
  {
    number: '05',
    text: 'Mantener apagadas las luces, los aires acondicionados y televisores, mientras no hallan pacientes en las habitaciones.',
    icon: <Tv className="h-8 w-8" />,
    position: 'bottom-1/4 -right-8',
    color: 'text-indigo-500',
  },
  {
    number: '06',
    text: 'Mantener las llaves de los grifos cerradas mientras no utilices el agua.',
    icon: <Droplets className="h-8 w-8" />,
    position: 'top-1/4 -right-8',
    color: 'text-cyan-500',
  },
  {
    number: '07',
    text: 'Informar a mantenimiento sobre daños en los grifos, tuberías. Etc',
    icon: <Wrench className="h-8 w-8" />,
    position: 'top-16 right-12',
    color: 'text-emerald-500',
  },
];

const Tip = ({ tip }: { tip: (typeof sustainabilityTips)[0] }) => (
  <div className={cn('absolute w-40 text-center flex flex-col items-center gap-2', tip.position)}>
    <div className="flex items-center justify-center gap-2">
      <div className={cn('text-5xl font-bold', tip.color)}>{tip.number}</div>
      <div
        className={cn(
          'h-16 w-16 rounded-full flex items-center justify-center bg-white shadow-md',
          tip.color
        )}
      >
        {tip.icon}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{tip.text}</p>
  </div>
);

const BrandLogo = ({ text, highlight }: { text: string; highlight: string }) => (
    <div className="flex items-center gap-2">
        <Atom className="h-6 w-6 text-cyan-600"/>
        <div className="text-sm">
            <span className="font-bold">{text}</span>
            <span className="text-cyan-600"> {highlight}</span>
        </div>
    </div>
);


export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Infographic Section */}
        <div className="flex flex-col items-center justify-center gap-8 py-10">
          <div className="relative h-[450px] w-[450px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-white shadow-xl flex flex-col items-center justify-center text-center p-4">
                <span className="text-sm font-light text-muted-foreground">TIPS DE</span>
                <h2 className="text-2xl font-bold text-gray-800">SOSTENIBILIDAD</h2>
                <h3 className="text-3xl font-extrabold text-green-500">AMBIENTAL</h3>
              </div>
            </div>
            {sustainabilityTips.map((tip) => (
              <Tip key={tip.number} tip={tip} />
            ))}
          </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-8">
                <BrandLogo text="Grupo" highlight="Clínica Médicos" />
                <BrandLogo text="Clínica" highlight="Valledupar" />
                <BrandLogo text="Red GLOBAL de HOSPITALES" highlight="VERDES y SALUDABLES" />
            </div>
        </div>

        {/* Login Form Section */}
        <div className="flex items-center justify-center">
          <Card className="mx-auto w-full max-w-sm border-0 shadow-none bg-transparent">
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Usuario</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="bg-white"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                  </div>
                  <Input id="password" type="password" required className="bg-white" />
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
    </div>
  );
}
