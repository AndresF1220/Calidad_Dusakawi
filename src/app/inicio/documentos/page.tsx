
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, ShieldCheck, Users, Briefcase, Shield, CheckCircle, Gavel, AlertTriangle, Megaphone, PlusCircle } from "lucide-react";
import { useAreas } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';

const iconMap: { [key: string]: React.ElementType } = {
    financiera: Building,
    'gestion-riesgo': ShieldCheck,
    intercultural: Users,
    contratacion: Briefcase,
    'control-interno': Shield,
    'gestion-calidad': CheckCircle,
    'asesoria-juridica': Gavel,
    sarlaft: AlertTriangle,
    comunicaciones: Megaphone,
    'default': Building,
};


export default function RepositoryAreasPage() {
  const { areas, isLoading } = useAreas();
  const [isAdding, setIsAdding] = useState(false);

  const macroprocesos = areas?.map(area => ({
      title: area.nombre,
      slug: area.id,
      icon: iconMap[area.id] || iconMap['default'],
      description: `Gestión de ${area.nombre.toLowerCase()}`
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Mapa de Procesos</h1>
            <p className="text-muted-foreground">Seleccione un área para explorar su información y procesos asociados.</p>
        </div>
        <AddEntityForm 
            entityType="area" 
            isOpen={isAdding} 
            onOpenChange={setIsAdding}
        >
            <Button onClick={() => setIsAdding(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Área
            </Button>
        </AddEntityForm>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
        ))}
        {macroprocesos?.map((area) => (
            <Link key={area.slug} href={`/inicio/documentos/${area.slug}`} className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                    <area.icon className="h-16 w-16 text-primary mb-4" />
                    <CardHeader className="p-0">
                    <CardTitle className="font-headline text-xl">{area.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                    <CardDescription>
                        {area.description}
                    </CardDescription>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
       {!isLoading && macroprocesos?.length === 0 && (
          <p className="text-center text-muted-foreground col-span-full">No hay áreas creadas. Comience por agregar una.</p>
       )}
    </div>
  );
}
