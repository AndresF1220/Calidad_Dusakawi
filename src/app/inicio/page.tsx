'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from 'lucide-react';

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Panel de Control</h1>
        <p className="text-muted-foreground">Bienvenido a su panel de Quality Central.</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        <Link href="/inicio/documentos" className="block group">
          <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer shadow-md hover:shadow-lg transition-shadow rounded-lg">
            <FolderKanban className="h-16 w-16 text-primary mb-4 transition-transform group-hover:scale-110" />
            <CardHeader className="p-0">
              <CardTitle className="font-headline text-xl">Mapa de procesos</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <CardDescription>
                Acceda a la estructura documental, suba y gestione archivos.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  );
}
