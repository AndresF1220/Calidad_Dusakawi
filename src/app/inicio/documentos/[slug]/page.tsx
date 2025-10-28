
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Folder, FileText, User, Target, GitBranch, Edit, Save, X } from 'lucide-react';
import { getAreaById } from '@/data/areasProcesos';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

  // SIMULATE SUPERUSER
  const isSuperuser = true; 

  const [caracterizacion, setCaracterizacion] = useState(getAreaCaracterizacion(slug));
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      objetivo: caracterizacion?.objetivo || '',
      alcance: caracterizacion?.alcance || '',
      responsable: caracterizacion?.responsable || ''
  });

  useEffect(() => {
    // In a real app, you would fetch this from Firestore
    const fetchedCaracterizacion = getAreaCaracterizacion(slug);
    setCaracterizacion(fetchedCaracterizacion);
    setFormData({
        objetivo: fetchedCaracterizacion?.objetivo || '',
        alcance: fetchedCaracterizacion?.alcance || '',
        responsable: fetchedCaracterizacion?.responsable || ''
    });
  }, [slug]);

  if (!area) {
    notFound();
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSave = async () => {
    console.log('Saving data to Firestore:', {
      idEntidad: slug,
      tipo: 'area',
      ...formData
    });
    // try {
    //   const docRef = doc(firestore, 'caracterizaciones', slug);
    //   await setDoc(docRef, {
    //     idEntidad: slug,
    //     tipo: 'area',
    //     ...formData,
    //     fechaCreacion: serverTimestamp(),
    //     creadaPor: 'superuser_id', // Replace with actual user ID
    //     repositorioId: slug,
    //     editable: true,
    //   }, { merge: true });
    //   setCaracterizacion(formData); // Optimistically update UI
    //   setIsEditing(false);
    // } catch (error) {
    //   console.error("Error saving characterization: ", error);
    // }
    setCaracterizacion(formData); // Simulate save
    setIsEditing(false);
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{area.titulo}</h1>
        <p className="text-muted-foreground">Información de caracterización y procesos asociados.</p>
      </div>

       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle className="font-headline">
              Caracterización del Área
            </CardTitle>
          </div>
           {isSuperuser && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2"/>
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!caracterizacion && !isEditing ? (
            <p className="text-muted-foreground text-center py-4">
              No se ha registrado la caracterización para este elemento.
            </p>
          ) : isEditing ? (
            <div className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="objetivo">Objetivo</Label>
                    <Textarea id="objetivo" name="objetivo" value={formData.objetivo} onChange={handleInputChange} rows={3} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="alcance">Alcance</Label>
                    <Textarea id="alcance" name="alcance" value={formData.alcance} onChange={handleInputChange} rows={3} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input id="responsable" name="responsable" value={formData.responsable} onChange={handleInputChange} />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2"/>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2"/>
                        Guardar
                    </Button>
                </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Objetivo</h3>
                  <p className="text-muted-foreground">{caracterizacion?.objetivo}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GitBranch className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Alcance</h3>
                  <p className="text-muted-foreground">{caracterizacion?.alcance}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h3 className="font-semibold">Responsable</h3>
                  <p className="text-muted-foreground">{caracterizacion?.responsable}</p>
                </div>
              </div>
            </div>
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

