
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder } from 'lucide-react';
import { getAreaById } from '@/data/areasProcesos';
import { notFound } from 'next/navigation';

export default function ProcesosDeAreaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const area = getAreaById(slug);

  if (!area) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{area.titulo}</h1>
        <p className="text-muted-foreground">Seleccione un proceso para ver su documentación.</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        {area.procesos.map((proceso) => (
            <Link key={proceso.id} href={`/inicio/documentos/${slug}/${proceso.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Folder className="h-16 w-16 text-primary mb-4" />
                    <CardHeader className="p-0">
                        <CardTitle className="font-headline text-lg">{proceso.nombre}</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
        ))}
         {area.procesos.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground mt-8">
                <p>No hay procesos definidos para esta área todavía.</p>
            </div>
         )}
      </div>
    </div>
  );
}
