
'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';
import { useArea } from '@/hooks/use-areas-data';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft, MoreVertical } from 'lucide-react';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { EntityOptionsDropdown } from '@/components/dashboard/EntityOptionsDropdown';

export default function AreaIdPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const { area, isLoading } = useArea(areaId);
  const isAdmin = useIsAdmin();
  const [isAdding, setIsAdding] = useState(false);

  // If params are not yet available, show a loading state.
  if (!areaId) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Área no encontrada</h2>
        <p className="text-muted-foreground mb-6">El área que busca no existe o ha sido eliminada.</p>
        <Button asChild>
          <Link href="/inicio/documentos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Mapa de Procesos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">{area.nombre}</h1>
         <div className="flex items-center gap-2">
            <AddEntityForm 
                entityType="process"
                parentId={area.id}
                isOpen={isAdding}
                onOpenChange={setIsAdding}
            >
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Proceso
                </Button>
            </AddEntityForm>
            <EntityOptionsDropdown
                entityId={area.id}
                entityType="area"
                entityName={area.nombre}
                redirectOnDelete="/inicio/documentos"
            />
        </div>
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
