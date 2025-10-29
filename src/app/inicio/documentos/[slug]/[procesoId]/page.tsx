
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById, getProceso } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';

export default function ProcesoPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const procesoId = params.procesoId as string;
  const isAdmin = useIsAdmin();
  
  const area = getAreaById(areaId);
  const proceso = getProceso(areaId, procesoId);

  if (!area || !proceso) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{proceso.nombre}</h1>
      </div>

      <CaracterizacionPanel idEntidad={`${areaId}:${procesoId}`} tipo="proceso" isAdmin={isAdmin} />

      {proceso.subprocesos && proceso.subprocesos.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold font-headline">Sub-procesos</h2>
          <ProcesoCards areaId={areaId} procesoId={procesoId} />
        </div>
      )}

      <RepoEmbed areaId={areaId} procesoId={procesoId} />
    </div>
  );
}

    
