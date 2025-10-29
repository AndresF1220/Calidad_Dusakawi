
'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';
import { useSubproceso, useProceso, useArea } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';

const slugify = (text: string) => {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD') // split an accented letter in the base letter and the accent
        .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

export default function SubprocesoPage() {
  const params = useParams();
  const areaId = params.slug as string;
  const procesoId = params.procesoId as string;
  const subprocesoSlug = params.subprocesoId as string;
  const isAdmin = useIsAdmin();

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoSlug);


  if (isLoadingArea || isLoadingProceso || isLoadingSubproceso) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (!area || !proceso || !subproceso) {
    notFound();
  }
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline capitalize">{subproceso.nombre}</h1>
      </div>

      <CaracterizacionPanel idEntidad={`${areaId}:${procesoId}:${subproceso.id}`} tipo="subproceso" isAdmin={isAdmin} />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subproceso.id} />
    </div>
  );
}

    
