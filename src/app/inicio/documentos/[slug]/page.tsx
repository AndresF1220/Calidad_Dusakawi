
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      </div>

      <CaracterizacionPanel idEntidad={slug} tipo="area" />

       <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold font-headline">Procesos</h2>
          <ProcesoCards areaId={slug} />
       </div>
    </div>
  );
}
