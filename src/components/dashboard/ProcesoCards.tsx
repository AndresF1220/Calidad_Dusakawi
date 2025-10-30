
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from 'lucide-react';
import { useProcesos, useSubprocesos } from '@/hooks/use-areas-data';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { EntityOptionsDropdown } from './EntityOptionsDropdown';
import { useIsAdmin } from '@/lib/authMock';

interface ProcesoCardsProps {
    areaId: string;
    procesoId?: string;
}

const ItemCard = ({ item, linkHref, entityType, parentId, grandParentId }: { item: any, linkHref: string, entityType: 'process' | 'subprocess', parentId?: string, grandParentId?: string }) => {
    const { toast } = useToast();
    const isAdmin = useIsAdmin();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Stop navigation if the click is on the dropdown menu or its trigger
        if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]') || (e.target as HTMLElement).closest('[data-radix-dropdown-menu-content]')) {
             e.preventDefault();
             return;
        }

        if (!item || !item.id) {
            e.preventDefault();
            toast({
                variant: 'destructive',
                title: 'Elemento no encontrado',
                description: 'El elemento que intenta abrir ya no existe o no se pudo cargar.',
            });
        } else {
             window.location.href = linkHref;
        }
    };
    
    return (
        <div className="relative group">
            <Card className="h-full flex flex-col items-center justify-center text-center p-6 transition-colors hover:bg-muted/50 cursor-pointer" onClick={handleClick}>
                <Folder className="h-16 w-16 text-primary mb-4" />
                <CardHeader className="p-0">
                    <CardTitle className="font-headline text-lg">{item?.nombre || 'Elemento inválido'}</CardTitle>
                </CardHeader>
            </Card>
             {isAdmin && item.id && (
                 <div 
                    className="absolute top-2 right-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                 >
                    <EntityOptionsDropdown
                        entityId={item.id}
                        entityType={entityType}
                        entityName={item.nombre}
                        parentId={parentId}
                        grandParentId={grandParentId}
                        redirectOnDelete={entityType === 'process' ? `/inicio/documentos/area/${parentId}` : `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`}
                    />
                </div>
            )}
        </div>
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
                        entityType="subprocess"
                        parentId={procesoId}
                        grandParentId={areaId}
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
                    entityType="process"
                    parentId={areaId}
                />
            ))}
        </div>
    );
}

    