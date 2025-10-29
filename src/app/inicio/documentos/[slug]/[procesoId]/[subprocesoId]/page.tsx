
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById, getProceso } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';

export default function SubprocesoPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;
  
  const area = getAreaById(areaId);
  const proceso = getProceso(areaId, procesoId);
  
  // Find subproceso by comparing slugified version with the param
  const subproceso = proceso?.subprocesos.find(s => s.toLowerCase().replace(/ /g, '-') === subprocesoId);

  if (!area || !proceso || !subproceso) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline capitalize">{subproceso.replace(/-/g, ' ')} — {proceso.nombre} — {area.titulo}</h1>
      </div>

      <CaracterizacionPanel idEntidad={`${areaId}:${procesoId}:${subprocesoId}`} tipo="subproceso" />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subprocesoId} />
    </div>
  );
}
