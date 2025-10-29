
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';

export default function AreaPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const area = getAreaById(areaId);
  const isAdmin = useIsAdmin();

  if (!area) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{area.titulo}</h1>
      </div>

      <CaracterizacionPanel idEntidad={areaId} tipo="area" isAdmin={isAdmin} />

       <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold font-headline">Procesos</h2>
          <ProcesoCards areaId={areaId} />
       </div>
       
       <RepoEmbed areaId={areaId} />
    </div>
  );
}
