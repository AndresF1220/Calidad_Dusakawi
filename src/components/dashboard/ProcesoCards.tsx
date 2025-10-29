
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder } from 'lucide-react';
import { getAreaById, getProceso } from '@/data/areasProcesos';

interface ProcesoCardsProps {
    areaId: string;
    procesoId?: string;
}

export default function ProcesoCards({ areaId, procesoId }: ProcesoCardsProps) {
    
    if (procesoId) {
        // Logic to display sub-processes
        const proceso = getProceso(areaId, procesoId);
        const subprocesos = proceso?.subprocesos || [];

        if (subprocesos.length === 0) {
            return (
                <div className="col-span-full text-center text-muted-foreground mt-8">
                    <p>No hay sub-procesos definidos para este proceso.</p>
                </div>
            );
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subprocesos.map((sub, index) => (
                     <Link key={index} href={`/inicio/documentos/${areaId}/${procesoId}/${sub.toLowerCase().replace(/ /g, '-')}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                        <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                            <Folder className="h-16 w-16 text-primary mb-4" />
                            <CardHeader className="p-0">
                                <CardTitle className="font-headline text-lg">{sub}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
             </div>
        )

    }

    // Logic to display processes
    const area = getAreaById(areaId);
    const procesos = area?.procesos || [];
    
    if (procesos.length === 0) {
        return (
            <div className="col-span-full text-center text-muted-foreground mt-8">
                <p>No hay procesos definidos para esta área todavía.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {procesos.map((proceso) => (
                <Link key={proceso.id} href={`/inicio/documentos/${areaId}/${proceso.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                    <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                        <Folder className="h-16 w-16 text-primary mb-4" />
                        <CardHeader className="p-0">
                            <CardTitle className="font-headline text-lg">{proceso.nombre}</CardTitle>
                        </CardHeader>
                            {proceso.subprocesos && proceso.subprocesos.length > 0 && (
                            <CardDescription className="mt-2 text-xs">
                                {proceso.subprocesos.join(', ')}
                            </CardDescription>
                        )}
                    </Card>
                </Link>
            ))}
        </div>
    );
}
