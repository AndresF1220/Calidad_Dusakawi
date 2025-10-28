
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, ShieldCheck, Users, Briefcase, Shield, CheckCircle, Gavel, AlertTriangle, Megaphone } from "lucide-react";
import { AREAS } from '@/data/areasProcesos';

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
};


export default function RepositoryAreasPage() {
    const macroprocesos = AREAS.map(area => ({
        title: area.titulo,
        slug: area.id,
        icon: iconMap[area.id] || Building,
        description: `Gestión de ${area.titulo.toLowerCase()}`
    }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mapa de Procesos</h1>
        <p className="text-muted-foreground">Seleccione un área para ver su documentación.</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        {macroprocesos.map((area) => (
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
    </div>
  );
}
