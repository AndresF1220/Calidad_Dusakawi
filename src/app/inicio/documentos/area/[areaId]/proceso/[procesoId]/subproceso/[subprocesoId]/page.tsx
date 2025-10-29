
'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useSubproceso, useProceso, useArea } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubprocesoIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);

  // Wait for params and all data to load
  const isLoading = !areaId || !procesoId || !subprocesoId || isLoadingArea || isLoadingProceso || isLoadingSubproceso;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  // Only call notFound after loading is complete and data is missing
  if (!area || !proceso || !subproceso) {
    notFound();
  }
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline capitalize">{subproceso.nombre}</h1>
      </div>

      <CaracterizacionPanel idEntidad={`${areaId}:${procesoId}:${subproceso.id}`} tipo="subproceso" />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subproceso.id} />
    </div>
  );
}
