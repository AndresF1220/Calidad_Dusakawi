
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, ShieldCheck, Users, Briefcase, Shield, CheckCircle, Gavel, AlertTriangle, Megaphone, PlusCircle, Loader2 } from "lucide-react";
import { useAreas } from '@/hooks/use-areas-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AddEntityForm } from '@/components/dashboard/AddEntityForm';
import { useToast } from '@/hooks/use-toast';
import { seedProcessMapAction } from '@/app/actions';

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
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const seedData = async () => {
        if (!isLoading && areas?.length === 0) {
            setIsSeeding(true);
            toast({
                title: "Restaurando mapa de procesos...",
                description: "La base de datos está vacía. Se restaurarán los datos predeterminados.",
            });
            const result = await seedProcessMapAction();
            if (result.error) {
                toast({
                    variant: 'destructive',
                    title: 'Error en la restauración',
                    description: result.error,
                });
            } else {
                 toast({
                    title: '¡Éxito!',
                    description: result.message,
                });
            }
            setIsSeeding(false);
        }
    };
    seedData();
  }, [isLoading, areas, toast]);


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
        {(isLoading || isSeeding) && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
        ))}
        {!isSeeding && macroprocesos?.map((area) => (
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
       {!isLoading && !isSeeding && macroprocesos?.length === 0 && (
            <div className="col-span-full text-center py-10">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                <p className="mt-4 text-center text-muted-foreground">No hay áreas creadas. Comience por agregar una o espere la restauración automática.</p>
            </div>
       )}
    </div>
  );
}
