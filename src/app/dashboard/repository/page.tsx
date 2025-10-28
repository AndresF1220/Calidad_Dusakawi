
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from 'lucide-react';

export default function RepositoryLandingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Repositorio</h1>
        <p className="text-muted-foreground">
          Navegue por los procesos y la documentación de la organización.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        <Link href="/dashboard/repository/documents" className="block hover:shadow-lg transition-shadow rounded-lg">
          <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <FolderKanban className="h-16 w-16 text-primary mb-4" />
            <CardHeader className="p-0">
              <CardTitle className="font-headline text-xl">Mapa de procesos</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <CardDescription>
                Acceda a la estructura documental de la empresa, suba y gestione archivos.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
