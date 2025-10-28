
'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, FileText, User, Target, GitBranch } from 'lucide-react';
import { getAreaById } from '@/data/areasProcesos';
import { Button } from '@/components/ui/button';

// Mock data for characterization - replace with Firestore data
const getAreaCaracterizacion = (areaId: string) => {
    const mockData: any = {
        'financiera': {
            objetivo: 'Garantizar la gestión eficiente de los recursos financieros y administrativos para apoyar la operación de la EPSI.',
            alcance: 'Cubre todos los procesos de contabilidad, tesorería, compras, gestión documental y talento humano.',
            responsable: 'Director(a) Administrativo y Financiero',
        },
        'gestion-riesgo': {
             objetivo: 'Gestionar integralmente el riesgo en salud de la población afiliada, desde la promoción hasta el tratamiento de alta complejidad.',
             alcance: 'Incluye la gestión de programas de promoción y mantenimiento, autorizaciones, y la auditoría de todos los niveles de atención.',
             responsable: 'Director(a) de Gestión del Riesgo',
        }
    };
    return mockData[areaId] || null;
}


export default function ProcesosDeAreaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const area = getAreaById(slug);

  if (!area) {
    notFound();
  }
  
  const caracterizacion = getAreaCaracterizacion(slug);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{area.titulo}</h1>
        <p className="text-muted-foreground">Información de caracterización y procesos asociados.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Caracterización del Área
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {caracterizacion ? (
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Objetivo</h3>
                  <p className="text-muted-foreground">{caracterizacion.objetivo}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GitBranch className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Alcance</h3>
                  <p className="text-muted-foreground">{caracterizacion.alcance}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Responsable</h3>
                  <p className="text-muted-foreground">{caracterizacion.responsable}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No se ha registrado la caracterización para este elemento.
            </p>
          )}
        </CardContent>
      </Card>


       <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold font-headline">Procesos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {area.procesos.map((proceso) => (
                    <Link key={proceso.id} href={`/inicio/documentos/${slug}/${proceso.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
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
                 {area.procesos.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground mt-8">
                        <p>No hay procesos definidos para esta área todavía.</p>
                    </div>
                 )}
              </div>
       </div>
    </div>
  );
}
