
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById, getProceso } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';


export default function RepositoryDocumentsPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const procesoId = params.procesoId as string;
  
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

      <CaracterizacionPanel idEntidad={procesoId} tipo="proceso" />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} />
    </div>
  );
}
