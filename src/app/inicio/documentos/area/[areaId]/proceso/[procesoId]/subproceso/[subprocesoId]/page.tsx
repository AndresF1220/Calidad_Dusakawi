
'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useSubproceso, useProceso, useArea } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { EntityOptionsDropdown } from '@/components/dashboard/EntityOptionsDropdown';
import { useIsAdmin } from '@/lib/authMock';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SubprocesoIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const subprocesoId = params.subprocesoId as string;
  const isAdmin = useIsAdmin();

  // Hooks to fetch data
  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);

  const isLoading = isLoadingArea || isLoadingProceso || isLoadingSubproceso;

  // Show skeleton loader if params are missing or data is loading.
  if (isLoading || !areaId || !procesoId || !subprocesoId) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  // After loading, if a document is missing, show a user-friendly message.
  if (!area || !proceso || !subproceso) {
    return (
       <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Subproceso no encontrado</h2>
        <p className="text-muted-foreground mb-6">El subproceso que busca no existe, ha sido eliminado o la ruta es incorrecta.</p>
        <Button asChild>
          <Link href={procesoId ? `/inicio/documentos/area/${areaId}/proceso/${procesoId}` : '/inicio/documentos'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Proceso
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline capitalize">{subproceso.nombre}</h1>
        {isAdmin && (
            <EntityOptionsDropdown
                entityId={subproceso.id}
                entityType="subprocess"
                entityName={subproceso.nombre}
                parentId={proceso.id}
                grandParentId={area.id}
                redirectOnDelete={`/inicio/documentos/area/${area.id}/proceso/${proceso.id}`}
            />
        )}
      </div>

      <CaracterizacionPanel idEntidad={subproceso.id} tipo="subproceso" />
      
      <RepoEmbed areaId={areaId} procesoId={procesoId} subprocesoId={subproceso.id} />
    </div>
  );
}
