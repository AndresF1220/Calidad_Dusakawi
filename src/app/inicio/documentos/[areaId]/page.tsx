'use client';

import { useParams, notFound } from 'next/navigation';
import CaracterizacionPanel from '@/components/dashboard/CaracterizacionPanel';
import ProcesoCards from '@/components/dashboard/ProcesoCards';
import RepoEmbed from '@/components/dashboard/RepoEmbed';
import { useIsAdmin } from '@/lib/authMock';
import { useArea } from '@/hooks/use-areas-data';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function AreaPage() {
  const params = useParams();
  const areaId = params.areaId as string;
  const { area, isLoading } = useArea(areaId);
  const isAdmin = useIsAdmin();
  const [isAdding, setIsAdding] = useState(false);

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
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">{area.nombre}</h1>
        <AddEntityForm 
            entityType="process"
            parentId={area.id}
            isOpen={isAdding}
            onOpenChange={setIsAdding}
        >
            <Button onClick={() => setIsAdding(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Proceso
            </Button>
        </AddEntityForm>
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
