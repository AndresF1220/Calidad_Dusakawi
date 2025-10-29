
'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useProceso, useArea } from '@/hooks/use-areas-data';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ProcesoIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const procesoId = params.procesoId as string;
  const [isAdding, setIsAdding] = useState(false);

  const { area, isLoading: isLoadingArea } = useArea(areaId);
  const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
  
  // Wait for params and data loading
  const isLoading = !areaId || !procesoId || isLoadingArea || isLoadingProceso;

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }

  // After loading, if a document is missing, show a user-friendly message
  if (!area || !proceso) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Proceso no encontrado</h2>
        <p className="text-muted-foreground mb-6">El proceso que busca no existe, ha sido eliminado o el área es incorrecta.</p>
        <Button asChild>
          <Link href={areaId ? `/inicio/documentos/area/${areaId}` : '/inicio/documentos'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Área
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">{proceso.nombre}</h1>
        <AddEntityForm 
            entityType="subprocess"
            parentId={proceso.id}
            grandParentId={area.id}
            isOpen={isAdding}
            onOpenChange={setIsAdding}
        >
            <Button onClick={() => setIsAdding(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Subproceso
            </Button>
        </AddEntityForm>
      </div>

      <CaracterizacionPanel idEntidad={`${proceso.id}`} tipo="proceso" />

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold font-headline">Sub-procesos</h2>
        <ProcesoCards areaId={areaId} procesoId={procesoId} />
      </div>

      <RepoEmbed areaId={areaId} procesoId={procesoId} />
    </div>
  );
}
