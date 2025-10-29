
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from 'lucide-react';
import { useProcesos, useSubprocesos } from '@/hooks/use-areas-data';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

interface ProcesoCardsProps {
    areaId: string;
    procesoId?: string;
}

const ItemCard = ({ item, linkHref }: { item: any, linkHref: string }) => {
    const { toast } = useToast();

    const handleClick = (e: React.MouseEvent) => {
        if (!item || !item.id) {
            e.preventDefault();
            toast({
                variant: 'destructive',
                title: 'Elemento no encontrado',
                description: 'El elemento que intenta abrir ya no existe o no se pudo cargar.',
            });
        }
    };
    
    const cardContent = (
         <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <Folder className="h-16 w-16 text-primary mb-4" />
            <CardHeader className="p-0">
                <CardTitle className="font-headline text-lg">{item.nombre}</CardTitle>
            </CardHeader>
        </Card>
    );

    if (!item || !item.id) {
        return <div onClick={handleClick}>{cardContent}</div>;
    }

    return (
        <Link href={linkHref} onClick={handleClick} className="block hover:shadow-lg transition-shadow rounded-lg">
           {cardContent}
        </Link>
    );
};


export default function ProcesoCards({ areaId, procesoId }: ProcesoCardsProps) {
    
    if (procesoId) {
        // Logic to display sub-processes
        const { subprocesos, isLoading } = useSubprocesos(areaId, procesoId);

        if (isLoading) {
            return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                 </div>
            )
        }
        
        if (subprocesos?.length === 0) {
            return (
                <div className="col-span-full text-center text-muted-foreground mt-8">
                    <p>No hay sub-procesos definidos para este proceso.</p>
                </div>
            );
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subprocesos?.map((sub) => (
                    <ItemCard 
                        key={sub.id}
                        item={sub}
                        linkHref={`/inicio/documentos/area/${areaId}/proceso/${procesoId}/subproceso/${sub.id}`}
                    />
                ))}
             </div>
        )
    }

    // Logic to display processes
    const { procesos, isLoading } = useProcesos(areaId);

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
             </div>
        )
    }
    
    if (procesos?.length === 0) {
        return (
            <div className="col-span-full text-center text-muted-foreground mt-8">
                <p>No hay procesos definidos para esta área todavía. Agregue uno para comenzar.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {procesos?.map((proceso) => (
                 <ItemCard 
                    key={proceso.id}
                    item={proceso}
                    linkHref={`/inicio/documentos/area/${areaId}/proceso/${proceso.id}`}
                />
            ))}
        </div>
    );
}
