
'use client';

import { useParams, notFound } from 'next/navigation';
import { getAreaById, getProceso } from '@/data/areasProcesos';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';

export default function SubprocesoPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;
  
  const area = getAreaById(areaId);
  const proceso = getProceso(areaId, procesoId);
  const isAdmin = useIsAdmin();
  
  // Find subproceso by comparing slugified version with the param
  const subproceso = proceso?.subprocesos.find(s => s.toLowerCase().replace(/ /g, '-') === subprocesoId);

  if (!area || !proceso || !subproceso) {
    notFound();
  }
  
  const formattedSubprocesoName = subproceso.charAt(0).toUpperCase() + subproceso.slice(1).replace(/-/g, ' ');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline capitalize">{formattedSubprocesoName}</h1>
      </div>

      <CaracterizacionPanel idEntidad={`${areaId}:${procesoId}:${subprocesoId}`} tipo="subproceso" isAdmin={isAdmin} />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subprocesoId} />
    </div>
  );
}
