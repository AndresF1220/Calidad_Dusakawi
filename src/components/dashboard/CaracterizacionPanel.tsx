
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  User,
  Target,
  GitBranch,
  Edit,
  Save,
  X,
} from 'lucide-react';

interface CaracterizacionPanelProps {
  idEntidad: string;
  tipo: 'area' | 'proceso' | 'subproceso';
}

// Mock data - replace with Firestore data
const getCaracterizacion = (idEntidad: string, tipo: string) => {
  const mockData: any = {
    area: {
      financiera: {
        objetivo:
          'Garantizar la gestión eficiente de los recursos financieros y administrativos para apoyar la operación de la EPSI.',
        alcance:
          'Cubre todos los procesos de contabilidad, tesorería, compras, gestión documental y talento humano.',
        responsable: 'Director(a) Administrativo y Financiero',
      },
      'gestion-riesgo': {
        objetivo:
          'Gestionar integralmente el riesgo en salud de la población afiliada, desde la promoción hasta el tratamiento de alta complejidad.',
        alcance:
          'Incluye la gestión de programas de promoción y mantenimiento, autorizaciones, y la auditoría de todos los niveles de atención.',
        responsable: 'Director(a) de Gestión del Riesgo',
      },
    },
    proceso: {
      contabilidad: {
        objetivo:
          'Registrar, clasificar y resumir las operaciones financieras para proporcionar información precisa para la toma de decisiones.',
        alcance:
          'Desde el registro de transacciones hasta la preparación de estados financieros y el cumplimiento de obligaciones tributarias.',
        responsable: 'Jefe de Contabilidad',
      },
      siau: {
        objetivo:
          'Garantizar la atención oportuna y efectiva de las solicitudes, quejas, reclamos y sugerencias de los usuarios.',
        alcance:
          'Cubre todos los canales de atención al usuario y la gestión de respuestas hasta el cierre del caso.',
        responsable: 'Coordinador(a) SIAU',
      },
    },
  };
  return mockData[tipo]?.[idEntidad] || null;
};

export default function CaracterizacionPanel({
  idEntidad,
  tipo,
}: CaracterizacionPanelProps) {
  // SIMULATE SUPERUSER
  const isSuperuser = true;

  const [caracterizacion, setCaracterizacion] = useState(
    getCaracterizacion(idEntidad, tipo)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    objetivo: caracterizacion?.objetivo || '',
    alcance: caracterizacion?.alcance || '',
    responsable: caracterizacion?.responsable || '',
  });

  useEffect(() => {
    // In a real app, you would fetch this from Firestore
    // e.g., const docSnap = await getDoc(doc(firestore, 'caracterizaciones', `${tipo}-${idEntidad}`));
    const fetchedData = getCaracterizacion(idEntidad, tipo);
    setCaracterizacion(fetchedData);
    setFormData({
      objetivo: fetchedData?.objetivo || '',
      alcance: fetchedData?.alcance || '',
      responsable: fetchedData?.responsable || '',
    });
  }, [idEntidad, tipo]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    console.log('Saving data to Firestore:', {
      idEntidad: idEntidad,
      tipo: tipo,
      ...formData,
    });
    // try {
    //   const docRef = doc(firestore, 'caracterizaciones', `${tipo}-${idEntidad}`);
    //   await setDoc(docRef, {
    //     idEntidad: idEntidad,
    //     tipo: tipo,
    //     ...formData,
    //     fechaCreacion: serverTimestamp(),
    //     creadaPor: 'superuser_id', // Replace with actual user ID
    //     repositorioId: idEntidad,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="font-headline">
            Caracterización del {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </CardTitle>
        </div>
        {isSuperuser && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
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
              <Textarea
                id="objetivo"
                name="objetivo"
                value={formData.objetivo}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alcance">Alcance</Label>
              <Textarea
                id="alcance"
                name="alcance"
                value={formData.alcance}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Objetivo
              </h3>
              <p className="text-muted-foreground">
                {caracterizacion?.objetivo}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Alcance
              </h3>
              <p className="text-muted-foreground">{caracterizacion?.alcance}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Responsable
              </h3>
              <p className="text-muted-foreground">
                {caracterizacion?.responsable}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
